import type { AngularCompilerOptions, ParsedConfiguration } from '@angular/compiler-cli';
import { componentIsApp } from '@bitdev/angular.app-types.angular-app-type';
import { AngularEnvOptions, getNodeModulesPaths, getWorkspace } from '@bitdev/angular.dev-services.common';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import {
  ArtifactDefinition,
  BuildContext,
  BuiltTaskResult,
  ComponentResult
} from '@teambit/builder';
import { Compiler, TranspileComponentParams } from '@teambit/compiler';
import { Component } from '@teambit/component';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { CyclicError } from '@teambit/graph.cleargraph';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { PACKAGE_JSON } from '@teambit/legacy/dist/constants';
import PackageJsonFile from '@teambit/legacy/dist/consumer/component/package-json-file';
import removeFilesAndEmptyDirsRecursively
  from '@teambit/legacy/dist/utils/fs/remove-files-and-empty-dirs-recursively';
import { Logger } from '@teambit/logger';
import { NgccProcessor } from '@bitdev/angular.dev-services.ngcc';
import { Workspace } from '@teambit/workspace';
import chalk from 'chalk';
import { mkdirsSync, outputFileSync } from 'fs-extra';
import type { NgPackageConfig } from 'ng-packagr/ng-package.schema';
import { join, posix, resolve } from 'path';

const ViewEngineTemplateError = `Cannot read property 'type' of null`;
const NG_PACKAGE_JSON = 'ng-package.json';

export interface NgPackagr {
  /**
   * Sets the path to the user's "ng-package" file (either `package.json`, `ng-package.json`, or `ng-package.js`)
   *
   * @param project File path
   * @return Self instance for fluent API
   */
  forProject(project: string): NgPackagr;

  /**
   * Overwrites the default TypeScript configuration.
   *
   * @param defaultValues A tsconfig providing default values to the compilation.
   * @return Self instance for fluent API
   */
  withTsConfig(defaultValues: ParsedConfiguration | string): NgPackagr;

  /**
   * Builds the project by kick-starting the 'build' transform over an (initially) empty `BuildGraph``
   *
   * @return A promisified result of the transformation pipeline.
   */
  build(): Promise<void>;
}


interface NgPackagrCompilerOptions {
  ngPackagrModulePath?: string;
  ngEnvOptions: AngularEnvOptions;
  tsCompilerOptions?: AngularCompilerOptions;
  name?: string;
  distDir: string;
  distGlobPatterns: string[];
  shouldCopyNonSupportedFiles: boolean;
  artifactName: string;
}

export class NgPackagrCompiler implements Compiler {
  readonly id = 'bitdev.angular/dev-services/compiler/ng-packagr';

  displayName = 'NgPackagr compiler';

  readDefaultTsConfig: () => Promise<ParsedConfiguration>;

  ngPackagr: NgPackagr;

  ngccProcessor?: NgccProcessor;

  private constructor(
    ngPackagrPath: string,
    private logger: Logger,
    private workspace: Workspace | undefined,
    private application: ApplicationMain,
    private depResolver: DependencyResolverMain,
    public distDir: string,
    public distGlobPatterns: string[],
    public shouldCopyNonSupportedFiles: boolean,
    public artifactName: string,
    private tsCompilerOptions: AngularCompilerOptions = {},
    private nodeModulesPaths: string[] = [],
    private ngEnvOptions: AngularEnvOptions
  ) {
    if (this.ngEnvOptions.useNgcc) {
      this.ngccProcessor = new NgccProcessor();
    }
    // eslint-disable-next-line global-require,import/no-dynamic-require
    this.ngPackagr = require(ngPackagrPath).ngPackagr();

    // eslint-disable-next-line global-require,import/no-dynamic-require
    const module = require(ngEnvOptions.readDefaultTsConfig);
    if (typeof module.readDefaultTsConfig !== 'undefined') {
      // Angular v8 to v12
      this.readDefaultTsConfig = module.readDefaultTsConfig;
    } else {
      // Angular v13+
      this.readDefaultTsConfig = async() => {
        const {initializeTsConfig} = module;
        const entryPoints: any = [{
          data: {
            entryPoint: {
              moduleId: '@bitdev/angular.dev-services.compiler.ng-packagr',
              entryFilePath: '',
              flatModuleFile: ''
            },
            tsConfig: null
          }
        }];
        await initializeTsConfig(undefined, entryPoints);
        return entryPoints[0].data.tsConfig;
      };
    }
  }

  updatePaths(packageJson: Record<string, any>) {
    // TODO(ocombe): type this
    const updatePackageJson: any = {
      sideEffects: packageJson.sideEffects === 'true'
    };
    const props = ['main', 'metadata', 'module', 'es2015', 'es2020', 'es2022', 'esm2015', 'esm2020', 'esm2022', 'fesm2015', 'fesm2020', 'fesm2022', 'typings', 'types', 'node', 'default'];
    props.forEach(prop => {
      // Angular v13+ doesn't generate umd bundles anymore, so we don't want to update the main entry point
      // as it will cause the component to fail to load with jest
      if (packageJson[prop] && (prop !== 'main' || packageJson[prop].includes('.umd.js'))) {
        updatePackageJson[prop] = posix.join(this.distDir, packageJson[prop]);
      }
    });
    if (packageJson.exports) {
      updatePackageJson.exports = packageJson.exports;
      props.forEach(prop => {
        if (packageJson.exports['.'][prop]) {
          updatePackageJson.exports['.'][prop] = `./${  posix.join(this.distDir, packageJson.exports['.'][prop])}`;
        }
      });
    }
    return updatePackageJson;
  }

  async ngPackagrCompilation(
    pathToComponent: string,
    pathToOutputFolder: string,
    tsCompilerOptions: AngularCompilerOptions,
    // component ids of other angular components in the workspace
    componentIds: string[],
    isBuild = true
  ): Promise<void> {
    // check for dependencies other than tslib and move them to peer dependencies
    // see https://github.com/ng-packagr/ng-packagr/blob/master/docs/dependencies.md#general-recommendation-use-peerdependencies-whenever-possible
    const packageJson = PackageJsonFile.loadFromPathSync(pathToOutputFolder, '');
    const {dependencies} = packageJson.packageJsonObject;
    // const peerDependencies = packageJson.packageJsonObject.peerDependencies;
    const allowedNonPeerDependencies: string[] = [];
    const depKeys = Object.keys(dependencies).filter(dep => dep !== 'tslib'); // only tslib is allowed in dependencies
    if (depKeys.length) {
      depKeys.forEach((dep: string) => {
        if (!componentIds.includes(dep)) {
          allowedNonPeerDependencies.push(dep);
        } else {
          // peerDependencies[dep] = dependencies[dep];
          // delete dependencies[dep];
        }
      });
      // packageJson.addOrUpdateProperty('dependencies', dependencies);
      // packageJson.addOrUpdateProperty('peerDependencies', peerDependencies);
    }

    // update package.json
    await packageJson.write();

    // create ng-package.json config file for ngPackagr
    const ngPackageJson: NgPackageConfig = {
      dest: this.distDir,
      lib: {
        entryFile: posix.join(pathToComponent, 'public-api.ts')
      },
      allowedNonPeerDependencies
    };

    if (allowedNonPeerDependencies.length) {
      // eslint-disable-next-line no-console
      console.warn(chalk.yellow(`\nWARNING: You have dependencies declared as "runtime dependencies" ("${allowedNonPeerDependencies.join('", "')}"). In most cases Angular recommends using peer dependencies instead (see: https://github.com/ng-packagr/ng-packagr/blob/main/docs/dependencies.md).\n`));
    }

    outputFileSync(join(pathToOutputFolder, NG_PACKAGE_JSON), JSON.stringify(ngPackageJson, null, 2));

    // add all node modules paths to TypeScript paths to ensure that it finds all existing dependencies
    // eslint-disable-next-line no-param-reassign
    tsCompilerOptions.paths = tsCompilerOptions.paths || {};
    // eslint-disable-next-line no-param-reassign
    tsCompilerOptions.paths['*'] = ['*', ...this.nodeModulesPaths.map(path => join(path, '*'))];

    const parsedTsConfig = await this.readDefaultTsConfig();
    parsedTsConfig.options = { ...parsedTsConfig.options, ...tsCompilerOptions };

    return this.ngPackagr
      .withTsConfig(parsedTsConfig)
      .forProject(join(pathToOutputFolder, NG_PACKAGE_JSON))
      .build()
      .then(async() => {
        // copy over properties generated by ngPackagr
        const tempPackageJson = (await PackageJsonFile.load(pathToOutputFolder, this.distDir)).packageJsonObject;
        const jsonProps = this.updatePaths(tempPackageJson);
        packageJson.mergePackageJsonObject(jsonProps);
        await packageJson.write();
        // delete the [ng-]package.json file generated by ngPackagr
        await removeFilesAndEmptyDirsRecursively([resolve(join(pathToOutputFolder, this.distDir, PACKAGE_JSON))]);
        await removeFilesAndEmptyDirsRecursively([resolve(join(pathToOutputFolder, NG_PACKAGE_JSON))]);
        // eslint-disable-next-line consistent-return
      }, (err: Error) => {
        if (err.message === ViewEngineTemplateError && !tsCompilerOptions.fullTemplateTypeCheck) {
          // eslint-disable-next-line no-console
          console.warn(chalk.yellow(`\nError "${err.message}" triggered by the Angular compiler, retrying compilation without "fullTemplateTypeCheck" (you should probably create a custom environment using "bit create ng-env my-custom-angular-env" to set this option by default and avoid this error message)\n`));
          return this.ngPackagrCompilation(pathToComponent, pathToOutputFolder, {
            ...tsCompilerOptions,
            fullTemplateTypeCheck: false
          }, componentIds, isBuild);
        }
        // eslint-disable-next-line no-console
        console.error(err);
      });
  }

  /**
   * used by `bit compile`
   */
  async transpileComponent(params: TranspileComponentParams): Promise<void> {
    // Create dist if it doesn't exist to avoid a warning with `bit status`
    const dist = join(params.outputDir, this.distDir);
    mkdirsSync(dist);
    // We do not need to compile using ng-packagr (except for builds) because Angular reads the source files directly

    /* const isApp = componentIsApp(params.component, this.application);
    // No need to compile an app
    if (isApp) {
      return;
    }
    if (params.initiator === CompilationInitiator.PreStart || params.initiator === CompilationInitiator.Start) {
      // Process all node_modules folders (only works if the modules are hoisted)
      if (this.ngEnvOptions.useNgcc) {
        for (let i = 0; i < this.nodeModulesPaths.length; i++) {
          await this.ngccProcessor?.process(this.nodeModulesPaths[i]);
        }
      }
      return;
    }
    // recreate packageJson from component to make sure that its dependencies are updated with recent code changes
    const packageJson = PackageJsonFile.createFromComponent('', params.component.state._consumer);
    packageJson.workspaceDir = params.outputDir;
    await packageJson.write();
    // disable logger temporarily so that it doesn't mess up with ngPackagr logs
    this.logger.off();
    // Build component package
    await this.ngPackagrCompilation(params.componentDir, params.outputDir, this.tsCompilerOptions, false);
    this.logger.on(); */
  }

  private getArtifactDefinition(): ArtifactDefinition[] {
    return [{
      generatedBy: this.id,
      name: this.artifactName,
      globPatterns: this.distGlobPatterns
    }];
  }

  /**
   * used by `bit build`
   */
  async build(context: BuildContext): Promise<BuiltTaskResult> {
    // Process all node_modules folders (only works if the modules are hoisted)
    if (this.ngEnvOptions.useNgcc) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < this.nodeModulesPaths.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await this.ngccProcessor?.process(this.nodeModulesPaths[i]);
      }
    }

    let capsules = context.capsuleNetwork.seedersCapsules;
    if (typeof capsules.toposort !== 'undefined') {
      try {
        // try to sort the capsules by the dependency graph, can fail if there is a circular dependency
        capsules = await capsules.toposort(this.depResolver);
      } catch (err) {
        if (err instanceof CyclicError) {
          this.logger.consoleWarning(`Warning: ${err.message}, unable to sort components for compilation, the capsules will be built in an arbitrary order`);
        }
      }
    }
    const componentIds = context.components.map(component => component.id.toString());
    const componentCapsules = capsules.filter(capsule => componentIds.includes(capsule.component.id.toString()));
    const componentsResults: ComponentResult[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const capsule of componentCapsules) {
      const {component} = capsule;
      const currentComponentResult: ComponentResult = {
        component
      };
      const isApp = componentIsApp(component, this.application);
      if (!isApp) { // No need to compile an app
        try {
          // disable logger temporarily so that it doesn't mess up with ngPackagr logs
          this.logger.off();
          // eslint-disable-next-line no-await-in-loop
          await this.ngPackagrCompilation(capsule.path, capsule.path, this.tsCompilerOptions, componentIds, true);
          this.logger.on();
          // @ts-ignore
        } catch (e: any) {
          currentComponentResult.errors = [e];
        }

        if (this.shouldCopyNonSupportedFiles) {
          const distPath = join(capsule.path, this.distDir);
          component.filesystem.files.forEach(file => {
            if (!this.isFileSupported(file.path)) {
              outputFileSync(join(distPath, file.relative), file.contents);
            }
          });
        }
      }

      componentsResults.push({ ...currentComponentResult });
    }

    return {
      artifacts: this.getArtifactDefinition(),
      componentsResults
    };
  }

  /**
   * given a source file, return its parallel in the dists. e.g. index.ts => dist/index.js
   * used by `bit build` & `bit start` for compositions & doc files
   */
  getDistPathBySrcPath(srcPath: string): string {
    return srcPath;
  }

  /**
   * given a component, returns the path to the source folder to use for the preview, uses the one
   * in node_modules by default
   * used by `bit start` (so workspace is always available)
   */
  getPreviewComponentRootPath(component: Component): string {
    return this.workspace!.componentDir(component.id, {
      ignoreScopeAndVersion: true,
      ignoreVersion: true
    }, { relative: true });
  }

  /**
   * whether ngPackagr is able to compile the given path
   */
  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.ts') || (!!this.tsCompilerOptions.allowJs && filePath.endsWith('.js'));
  }

  version(): string {
    // eslint-disable-next-line global-require
    return require('ng-packagr/package.json').version;
  }

  static from(options: NgPackagrCompilerOptions): EnvHandler<NgPackagrCompiler> {
    return (context: EnvContext) => {
      const name = options.name || 'ng-packagr-compiler';
      const ngPackagrModulePath = options.ngPackagrModulePath || require.resolve('ng-packagr');
      const logger = context.createLogger(name);
      const workspace = getWorkspace(context);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const depResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const nodeModulesPaths = getNodeModulesPaths(true, isolator, workspace);

      return new NgPackagrCompiler(
        ngPackagrModulePath,
        logger,
        workspace,
        application,
        depResolver,
        options.distDir,
        options.distGlobPatterns,
        options.shouldCopyNonSupportedFiles,
        options.artifactName,
        options.tsCompilerOptions,
        nodeModulesPaths,
        options.ngEnvOptions
      );
    };
  }
}

// @ts-ignore
import type { AngularCompilerOptions, CompilerOptions, ParsedConfiguration} from '@angular/compiler-cli';
import {
  AngularEnvOptions,
  componentIsApp,
  getNodeModulesPaths,
  getWorkspace
} from '@bitdev/angular.dev-services.common';
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
import { PACKAGE_JSON } from '@teambit/legacy/dist/constants.js';
import PackageJsonFile from '@teambit/legacy/dist/consumer/component/package-json-file.js';
import { Logger } from '@teambit/logger';
import { Workspace } from '@teambit/workspace';
import chalk from 'chalk';
// @ts-ignore
import { mkdirsSync, outputFileSync, removeSync } from 'fs-extra/esm';
import type { NgPackageConfig } from 'ng-packagr/ng-package.schema.js';
import { createRequire } from 'node:module';
import { join, posix, resolve } from 'node:path';
import ts from 'typescript';
import type { Diagnostic, DiagnosticWithLocation } from 'typescript';

const ViewEngineTemplateError = `Cannot read property 'type' of null`;
const NG_PACKAGE_JSON = 'ng-package.json';

export interface FatalDiagnosticError {
  _isFatalDiagnosticError: boolean;

  toDiagnostic(): DiagnosticWithLocation;
}

export type DiagnosticsReporter = (diagnostics: Diagnostic) => void;

export function isFatalDiagnosticError(err: any): err is FatalDiagnosticError {
  return err._isFatalDiagnosticError === true;
}

export async function createDiagnosticsReporter(logger: Logger): Promise<DiagnosticsReporter> {
  // @ts-ignore
  const { formatDiagnostics } = await import('@angular/compiler-cli');
  // @ts-ignore
  const formatter = (diagnostic: Diagnostic) => formatDiagnostics([diagnostic]);
  return (diagnostic: Diagnostic | Error) => {
    let diag = diagnostic as any;
    let text: string;
    try {
      if (isFatalDiagnosticError((diagnostic))) {
        diag = diagnostic.toDiagnostic();
      }
      text = formatter(diag);
    } catch (e) {
      throw new Error(diag);
    }
    if (diag.category === ts.DiagnosticCategory.Error) {
      throw new Error(text);
    } else {
      logger.warn(text);
    }
  };
}

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
  ngPackagrModulePath: string;
  ngEnvOptions: AngularEnvOptions;
  tsCompilerOptions?: AngularCompilerOptions;
  tsconfigPath?: string;
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

  private constructor(
    private ngPackagrPath: string,
    private logger: Logger,
    private workspace: Workspace | undefined,
    private application: ApplicationMain,
    private depResolver: DependencyResolverMain,
    public distDir: string,
    public distGlobPatterns: string[],
    public shouldCopyNonSupportedFiles: boolean,
    public artifactName: string,
    private tsCompilerOptions: AngularCompilerOptions = {},
    private tsconfigPath?: string,
    private nodeModulesPaths: string[] = [],
  ) {
    this.readDefaultTsConfig = async() => {
      const { initializeTsConfig } = await import('ng-packagr/lib/ts/tsconfig.js');
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
          updatePackageJson.exports['.'][prop] = `./${ posix.join(this.distDir, packageJson.exports['.'][prop]) }`;
        }
      });
    }
    return updatePackageJson;
  }

  async ngPackagrCompilation(
    pathToComponent: string,
    pathToOutputFolder: string,
    tsCompilerOptions: AngularCompilerOptions,
    diagnosticsReporter: DiagnosticsReporter,
    // component ids of other angular components in the workspace
    componentIds: string[],
    isBuild = true
  ): Promise<void> {
    // check for dependencies other than tslib and move them to peer dependencies
    // see https://github.com/ng-packagr/ng-packagr/blob/master/docs/dependencies.md#general-recommendation-use-peerdependencies-whenever-possible
    // @ts-ignore
    const packageJson = PackageJsonFile.default.loadFromPathSync(pathToOutputFolder, '');
    const { dependencies } = packageJson.packageJsonObject;
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
    const ngPackageJsonPath = join(pathToOutputFolder, NG_PACKAGE_JSON);
    const ngPackageJson: NgPackageConfig = {
      dest: this.distDir,
      assets: ['src/assets'],
      lib: {
        cssUrl: 'inline',
        entryFile: posix.join(pathToComponent, 'public-api.ts')
      },
      allowedNonPeerDependencies
    };

    if (allowedNonPeerDependencies.length) {
      // eslint-disable-next-line no-console
      console.warn(chalk.yellow(`\nWARNING: You have dependencies declared as "runtime dependencies" ("${ allowedNonPeerDependencies.join('", "') }"). In most cases Angular recommends using peer dependencies instead (see: https://github.com/ng-packagr/ng-packagr/blob/main/docs/dependencies.md).\n`));
    }

    outputFileSync(ngPackageJsonPath, JSON.stringify(ngPackageJson, null, 2));

    // add all node modules paths to TypeScript paths to ensure that it finds all existing dependencies
    // eslint-disable-next-line no-param-reassign
    tsCompilerOptions.paths = tsCompilerOptions.paths || {};
    // eslint-disable-next-line no-param-reassign
    tsCompilerOptions.paths['*'] = ['*', ...this.nodeModulesPaths.map(path => join(path, '*'))];

    const parsedTsConfig = await this.readDefaultTsConfig();
    parsedTsConfig.options = { ...parsedTsConfig.options, ...tsCompilerOptions };

    const ngPackagr: NgPackagr = (await import(this.ngPackagrPath)).ngPackagr();
    return ngPackagr
      .withTsConfig(parsedTsConfig)
      .forProject(ngPackageJsonPath)
      .build()
      .then(async() => {
        // copy over properties generated by ngPackagr
        // @ts-ignore
        const tempPackageJson = PackageJsonFile.default.loadSync(pathToOutputFolder, this.distDir).packageJsonObject;
        const jsonProps = this.updatePaths(tempPackageJson);
        packageJson.mergePackageJsonObject(jsonProps);
        await packageJson.write();
        // delete the [ng-]package.json file generated by ngPackagr
        removeSync(resolve(join(pathToOutputFolder, this.distDir, PACKAGE_JSON)));
        removeSync(resolve(ngPackageJsonPath));
        // eslint-disable-next-line consistent-return
      }, async(err: Error) => {
        if (err.message === ViewEngineTemplateError && !tsCompilerOptions.fullTemplateTypeCheck) {
          // eslint-disable-next-line no-console
          console.warn(chalk.yellow(`\nError "${ err.message }" triggered by the Angular compiler, retrying compilation without "fullTemplateTypeCheck" (you should probably create a custom environment using "bit create ng-env my-custom-angular-env" to set this option by default and avoid this error message)\n`));
          return this.ngPackagrCompilation(pathToComponent, pathToOutputFolder, {
            ...tsCompilerOptions,
            fullTemplateTypeCheck: false
          }, diagnosticsReporter, componentIds, isBuild);
        }
        // eslint-disable-next-line no-console
        diagnosticsReporter(err as any);
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
    const diagnosticsReporter = await createDiagnosticsReporter(this.logger);
    let capsules = context.capsuleNetwork.seedersCapsules;
    if (typeof capsules.toposort !== 'undefined') {
      try {
        // try to sort the capsules by the dependency graph, can fail if there is a circular dependency
        capsules = await capsules.toposort(this.depResolver);
      } catch (err) {
        if (err instanceof CyclicError) {
          this.logger.consoleWarning(`Warning: ${ err.message }, unable to sort components for compilation, the capsules will be built in an arbitrary order`);
        }
      }
    }
    const componentIds = context.components.map(component => component.id.toString());
    const componentCapsules = capsules.filter(capsule => componentIds.includes(capsule.component.id.toString()));
    const componentsResults: ComponentResult[] = [];

    let tsCompilerOptions = this.tsCompilerOptions || {};
    if (this.tsconfigPath) {
      // these options are mandatory for ngPackagr to work
      const extraOptions: CompilerOptions = {
        // @ts-ignore
        target: ts.ScriptTarget.ES2022,

        // sourcemaps
        sourceMap: false,
        inlineSources: true,
        inlineSourceMap: true,

        outDir: '',
        declaration: true,

        // ng compiler
        enableResourceInlining: true,
      };

      // @ts-ignore
      const { readConfiguration } = await import('@angular/compiler-cli');
      const tsconfigJSON = readConfiguration(this.tsconfigPath, extraOptions);
      tsCompilerOptions = { ...tsCompilerOptions, ...tsconfigJSON.options };
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const capsule of componentCapsules) {
      const { component } = capsule;
      const currentComponentResult: ComponentResult = {
        component
      };
      const isApp = componentIsApp(component, this.application);
      if (!isApp) { // No need to compile an app
        try {
          // disable logger temporarily so that it doesn't mess up with ngPackagr logs
          this.logger.off();
          // eslint-disable-next-line no-await-in-loop
          await this.ngPackagrCompilation(capsule.path, capsule.path, tsCompilerOptions, diagnosticsReporter, componentIds, true);
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
    const require = createRequire(import.meta.url);
    // eslint-disable-next-line global-require
    return require('ng-packagr/package.json').version;
  }

  static from(options: NgPackagrCompilerOptions): EnvHandler<NgPackagrCompiler> {
    return (context: EnvContext) => {
      const name = options.name || 'ng-packagr-compiler';
      const ngPackagrModulePath = options.ngPackagrModulePath;
      const logger = context.createLogger(name);
      const workspace = getWorkspace(context);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const depResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const nodeModulesPaths = getNodeModulesPaths(true, isolator, workspace, true);

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
        options.tsconfigPath,
        nodeModulesPaths,
      );
    };
  }
}

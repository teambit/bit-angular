// @ts-ignore
import type { AngularCompilerOptions } from '@angular/compiler-cli';
import {
  ApplicationInternalOptions,
  componentIsApp,
  getNodeModulesPaths,
  getTempFolder,
  getWorkspace,
  NG_ELEMENTS_PATTERN,
  normalizePath
} from '@bitdev/angular.dev-services.common';
// @ts-ignore
import { buildApplication, BuildOutput, generateAppTsConfig, readTsConfig } from "@bitdev/angular.dev-services.vite";
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { ArtifactDefinition, BuildContext, BuiltTaskResult, ComponentResult } from '@teambit/builder';
import { CompilationInitiator, Compiler, TranspileComponentParams } from '@teambit/compiler';
import { Component } from '@teambit/component';
import DependencyResolverAspect, { DependencyResolverMain } from "@teambit/dependency-resolver";
import DevFilesAspect, { DevFilesMain } from "@teambit/dev-files";
import { EnvContext, EnvHandler } from '@teambit/envs';
import { CyclicError } from '@teambit/graph.cleargraph';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { Logger } from '@teambit/logger';
import { ScopeAspect, ScopeMain } from '@teambit/scope';
import type { PathOsBasedRelative } from '@teambit/toolbox.path.path';
import { Timer } from '@teambit/toolbox.time.timer';
import { Workspace } from '@teambit/workspace';
import chalk from 'chalk';
import { copySync, ensureDirSync, outputFileSync } from "fs-extra";
// @ts-ignore
import minimatch from "minimatch";
import { join } from 'path';
import { RollupCompiler } from './rollup/rollup.compiler';

interface AngularElementsCompilerOptions {
  ngPackagrModulePath?: string;
  tsCompilerOptions?: AngularCompilerOptions;
  name?: string;
  distDir: string;
  distGlobPatterns: string[];
  shouldCopyNonSupportedFiles: boolean;
  artifactName: string;
  tsconfigPath: string;
}

const iteratorsMap: Map<string, AsyncIterator<BuildOutput>> = new Map();

export class AngularElementsCompiler implements Compiler {
  readonly id = 'bitdev.angular/dev-services/compiler/elements';

  displayName = 'Angular elements compiler';

  rollupCompiler: RollupCompiler;

  distDir = this.opts.distDir;

  tempFolder: string = getTempFolder('ng-elements', this.workspace);

  private constructor(
    private logger: Logger,
    private workspace: Workspace | undefined,
    private application: ApplicationMain,
    private depsResolver: DependencyResolverMain,
    private devFilesMain: DevFilesMain,
    public opts: AngularElementsCompilerOptions,
    private nodeModulesPaths: string[] = [],
  ) {
    this.rollupCompiler = new RollupCompiler(this.opts.tsCompilerOptions, this.logger);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async compositionsCompilation(component: Component, componentDir: string, outputDir: string, watch = false) {
    const entryFile = join(componentDir, component.config.main);
    // Build compositions with rollup
    this.logger.console('\nBuilding Angular Elements component');
    const timer = Timer.create();
    timer.start();
    // const entryFiles = component.filesystem.files.map((file) => join(componentDir, file.relative))
    //   .filter((file) => this.isFileSupported(file));
    const dist = join(outputDir, this.opts.distDir);
    // TODO use a worker
    // TODO use build options for build setup
    await this.rollupCompiler.compile({
      entries: [entryFile],
      sourceRoot: componentDir,
      dest: dist,
      moduleName: component.id.fullName,
      nodeModulesPaths: this.nodeModulesPaths,
      compilationMode: 'full',
    }, watch);
    const duration = timer.stop();
    this.logger.console(chalk.green(`\n------------------------------------------------------------------------------
Built Angular Elements component:
 - from: ${componentDir}
 - to:   ${dist}
------------------------------------------------------------------------------`));
    this.logger.console(`\nBuild completed in ${chalk.bold(duration.elapsed)}ms`);
  }

  /**
   * used by `bit compile`
   */
  async transpileComponent(params: TranspileComponentParams, distDirs: PathOsBasedRelative[] = [], build = false): Promise<void> {
    const isApp = componentIsApp(params.component, this.application);
    // No need to compile an app
    if (isApp) {
      return;
    }

    // Build compositions
    // await this.compositionsCompilation(params.component, params.componentDir, params.outputDir, true);

    const watch = params.initiator === CompilationInitiator.PreWatch || params.initiator === CompilationInitiator.ComponentChanged;
    let iterator = iteratorsMap.get(params.component.id.toString());
    if (!iterator) {
      const angularOptions: ApplicationInternalOptions = {
        baseHref: `./`,
        namedChunks: true,
        optimization: build,
        // @ts-ignore
        outputHashing: "none",
        vendorChunk: false,
        commonChunk: false,
        browser: params.component.config.main,
        index: false,
        tsConfig: '',
        styles: false as any,
        assets: false as any,
        inlineStyleLanguage: "scss",
        ssr: false,
        prerender: false,
        // Disable the progress reporting with a loading spinner from Angular
        progress: false,
        watch
      };

      const outputDir = distDirs[0] || join(params.outputDir, this.distDir);
      ensureDirSync(outputDir);
      const appTsConfig = readTsConfig(this.opts.tsconfigPath);
      appTsConfig.files = [params.component.config.main];
      appTsConfig.exclude = appTsConfig.exclude || [];
      appTsConfig.exclude.push("./**/*.spec.ts");
      const tsconfigPath = normalizePath(join(this.tempFolder, `tsconfig/tsconfig-${Date.now()}.json`));
      const workspaceCmpsIDs = this.workspace?.listIds() ?? [];
      const bitCmps = await this.workspace?.getMany(workspaceCmpsIDs) ?? [params.component];
      generateAppTsConfig(bitCmps, params.componentDir, appTsConfig, tsconfigPath, this.depsResolver, this.workspace, [params.component.config.main], this.devFilesMain);

      const results = await buildApplication({
        angularOptions: {
          ...angularOptions,
          tsConfig: tsconfigPath
        },
        outputPath: outputDir,
        sourceRoot: '',
        workspaceRoot: params.componentDir,
        logger: this.logger,
        tempFolder: this.tempFolder,
        fastReturn: watch,
        consoleLogs: build
      });

      if (distDirs.length > 1) {
        // eslint-disable-next-line
        for (let i = 1; i < distDirs.length; i++) {
          ensureDirSync(distDirs[i]);
          copySync(outputDir, distDirs[i]);
        }
      }

      if (watch) {
        iterator = (results as AsyncIterable<BuildOutput>)[Symbol.asyncIterator]();
        iteratorsMap.set(params.component.id.toString(), iterator);
      }
    }
    if (iterator) {
      const res = (await iterator.next()).value;
      if (build && !res.success) {
        throw new Error("Failed to build Angular Elements component");
      }
    }
  }

  private getArtifactDefinition(): ArtifactDefinition[] {
    return [{
      generatedBy: this.id,
      name: this.opts.artifactName,
      globPatterns: this.opts.distGlobPatterns
    }];
  }

  /**
   * used by `bit build`
   */
  async build(context: BuildContext): Promise<BuiltTaskResult> {
    let capsules = context.capsuleNetwork.seedersCapsules;
    if (typeof capsules.toposort !== 'undefined') {
      try {
        // try to sort the capsules by the dependency graph, can fail if there is a circular dependency
        capsules = await capsules.toposort(this.depsResolver);
      } catch (err) {
        if (err instanceof CyclicError) {
          this.logger.consoleWarning(`Warning: ${err.message}, unable to sort components for compilation, the capsules will be built in an arbitrary order`);
        }
      }
    }
    const componentIds = context.components.map(component => component.id.toString());
    const componentCapsules = capsules.filter(capsule => componentIds.includes(capsule.component.id.toString()) && minimatch(capsule.component.config.main, NG_ELEMENTS_PATTERN));
    const componentsResults: ComponentResult[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const capsule of componentCapsules) {
      const { component } = capsule;
      if (!capsule) {
        throw new Error(`No capsule found for ${component.id} in network graph`);
      }
      const currentComponentResult: ComponentResult = {
        component
      };
      try {
        const distDirs = [join(capsule.path, this.distDir)];
        // await this.compositionsCompilation(component, capsule.path, capsule.path, false);
        // eslint-disable-next-line no-await-in-loop
        await this.transpileComponent({
          component,
          componentDir: capsule.path,
          outputDir: capsule.path,
          initiator: CompilationInitiator.ComponentAdded
        }, distDirs, true)
      } catch (e: any) {
        currentComponentResult.errors = [e];
      }

      if (this.opts.shouldCopyNonSupportedFiles) {
        const distPath = join(capsule.path, this.distDir);
        component.filesystem.files.forEach(file => {
          if (!this.isFileSupported(file.path)) {
            outputFileSync(join(distPath, file.relative), file.contents);
          }
        });
      }

      componentsResults.push({ ...currentComponentResult });
    }

    return {
      artifacts: this.getArtifactDefinition(),
      componentsResults,
    };
  }

  /**
   * given a source file, return its parallel in the dists. e.g. index.ts => dist/index.js
   * used by `bit build` & `bit start` for compositions & doc files
   */
  getDistPathBySrcPath(srcPath: string): string {
    // if (this.isFileSupported(srcPath) && this.compositions.isCompositionFile(srcPath)) {
    //   return join('dist', srcPath.replace(extname(srcPath), '.js'));
    // }
    return srcPath;
  }

  /**
   * given a component, returns the path to the source folder to use for the preview, uses the one
   * in node_modules by default
   * used by `bit start`
   */
  getPreviewComponentRootPath(component: Component): string {
    // return this.workspace!.componentPackageDir(component, { relative: true });
    return this.workspace!.componentDir(component.id, {
      ignoreVersion: true
    }, { relative: true });
  }

  /**
   * whether ngPackagr is able to compile the given path
   */
  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.ts') || (!!this.opts.tsCompilerOptions?.allowJs && filePath.endsWith('.js'));
  }

  version(): string {
    // eslint-disable-next-line global-require
    return require('@angular/elements/package.json').version;
  }

  static from(options: AngularElementsCompilerOptions): EnvHandler<AngularElementsCompiler> {
    return (context: EnvContext) => {
      const name = options.name || 'angular-elements-compiler';
      const logger = context.createLogger(name);
      const workspace = getWorkspace(context);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const depsResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
      const devFilesMain = context.getAspect<DevFilesMain>(DevFilesAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const scope = context.getAspect<ScopeMain>(ScopeAspect.id);
      const nodeModulesPaths = getNodeModulesPaths(true, isolator, context.envId, scope, workspace);

      return new AngularElementsCompiler(
        logger,
        workspace,
        application,
        depsResolver,
        devFilesMain,
        options,
        nodeModulesPaths
      );
    };
  }
}

import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { componentIsApp } from '@teambit/angular-apps';
import type { AngularEnvOptions } from '@teambit/angular-common';
import { getNodeModulesPaths, getWorkspace } from '@teambit/angular-common';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import {
  ArtifactDefinition,
  BuildContext,
  BuiltTaskResult,
  ComponentResult
} from '@teambit/builder';
import { Compiler, TranspileComponentParams } from '@teambit/compiler';
import { Component } from '@teambit/component';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { Timer } from '@teambit/legacy/dist/toolbox/timer';
import { Logger } from '@teambit/logger';
import { NgccProcessor } from '@teambit/ngcc';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import chalk from 'chalk';
import { extname, join } from 'path';
import { RollupCompiler } from './rollup/rollup.compiler';

interface AngularElementsCompilerOptions {
  ngPackagrModulePath?: string;
  ngEnvOptions: AngularEnvOptions;
  tsCompilerOptions?: AngularCompilerOptions;
  name?: string;
  distDir: string;
  distGlobPatterns: string[];
  shouldCopyNonSupportedFiles: boolean;
  artifactName: string;
}

export class AngularElementsCompiler implements Compiler {
  readonly id = 'teambit.angular/dev-services/compiler/angular-elements';
  displayName = 'Angular elements compiler';
  ngccProcessor?: NgccProcessor;
  rollupCompiler: RollupCompiler;

  private constructor(
    private logger: Logger,
    private workspace: Workspace | undefined,
    private compositions: CompositionsMain,
    private application: ApplicationMain,
    public distDir: string,
    public distGlobPatterns: string[],
    public shouldCopyNonSupportedFiles: boolean,
    public artifactName: string,
    private tsCompilerOptions: AngularCompilerOptions = {},
    private nodeModulesPaths: string[] = [],
    private ngEnvOptions: AngularEnvOptions
  ) {
    this.rollupCompiler = new RollupCompiler(this.tsCompilerOptions, this.logger);
    if (this.ngEnvOptions.useNgcc) {
      this.ngccProcessor = new NgccProcessor();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async compositionsCompilation(component: Component, componentDir: string, outputDir: string, watch = false) {
    // Process all node_modules folders (only works if the modules are hoisted)
    if (this.ngEnvOptions.useNgcc) {
      for (let i = 0; i < this.nodeModulesPaths.length; i++) {
        await this.ngccProcessor?.process(this.nodeModulesPaths[i]);
      }
    }
    // Build compositions with rollup
    this.logger.console('\nBuilding compositions');
    const timer = Timer.create();
    timer.start();
    const entryFiles = component.filesystem.files.map((file) => join(componentDir, file.relative))
      .filter((file) => this.isFileSupported(file));
    const dist = join(outputDir, this.distDir);
    // TODO use a worker
    // TODO use build options for build setup
    await this.rollupCompiler.compile({
      entries: entryFiles,
      sourceRoot: componentDir,
      dest: dist,
      moduleName: component.id.fullName,
      nodeModulesPaths: this.nodeModulesPaths
    }, watch, 'full');
    const duration = timer.stop();
    this.logger.console(chalk.green(`\n------------------------------------------------------------------------------
Built Angular Compositions
 - from: ${componentDir}
 - to:   ${dist}
------------------------------------------------------------------------------`));
    this.logger.console(`\nBuild completed in ${chalk.bold(duration.elapsed)}ms`);
  }

  /**
   * used by `bit compile`
   */
  async transpileComponent(params: TranspileComponentParams): Promise<void> {
    const isApp = componentIsApp(params.component, this.application);
    // No need to compile an app
    if (isApp) {
      return;
    }
    // if (params.initiator === CompilationInitiator.PreStart || params.initiator === CompilationInitiator.Start) {
    // Process all node_modules folders (only works if the modules are hoisted)
    if (this.ngEnvOptions.useNgcc) {
      for (let i = 0; i < this.nodeModulesPaths.length; i++) {
        await this.ngccProcessor?.process(this.nodeModulesPaths[i]);
      }
    }
    // Build compositions
    await this.compositionsCompilation(params.component, params.componentDir, params.outputDir, true);
    
    // }
    // TODO: implement compilation of components as webcomponents
    // throw new Error('not implemented');
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
    const capsules = context.capsuleNetwork.seedersCapsules;
    const componentsResults: ComponentResult[] = [];

    // Process all node_modules folders (only works if the modules are hoisted)
    if (this.ngEnvOptions.useNgcc) {
      for (let i = 0; i < this.nodeModulesPaths.length; i++) {
        await this.ngccProcessor?.process(this.nodeModulesPaths[i]);
      }
    }

    for (let i = 0; i < context.components.length; i++) {
      const component = context.components[i];
      const capsule = capsules.getCapsule(component.id);
      if (!capsule) {
        throw new Error(`No capsule found for ${component.id} in network graph`);
      }
      const currentComponentResult: ComponentResult = {
        component
      };
      const isApp = componentIsApp(component, this.application);
      if (!isApp) { // No need to compile an app
        try {
          await this.compositionsCompilation(component, capsule.path, capsule.path, false);
        } catch (e: any) {
          currentComponentResult.errors = [e];
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
    if (this.isFileSupported(srcPath) && this.compositions.isCompositionFile(srcPath)) {
      return join('dist', srcPath.replace(extname(srcPath), '.js'));
    }
    return srcPath;
  }

  /**
   * given a component, returns the path to the source folder to use for the preview, uses the one
   * in node_modules by default
   * used by `bit start`
   */
  getPreviewComponentRootPath(component: Component): string {
    return this.workspace!.componentPackageDir(component, { relative: true });
  }

  /**
   * whether ngPackagr is able to compile the given path
   */
  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.ts') || (!!this.tsCompilerOptions.allowJs && filePath.endsWith('.js'));
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
      const compositions = context.getAspect<CompositionsMain>(CompositionsAspect.id);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const nodeModulesPaths = getNodeModulesPaths(true, isolator, workspace);

      return new AngularElementsCompiler(
        logger,
        workspace,
        compositions,
        application,
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

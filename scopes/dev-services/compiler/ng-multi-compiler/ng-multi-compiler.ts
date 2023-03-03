import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { componentIsApp, NG_APP_PATTERN } from '@teambit/angular-apps';
import type { AngularEnvOptions } from '@teambit/angular-common';
import { AngularElementsCompiler } from '@teambit/angular-elements';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { BabelAspect, BabelCompiler, BabelMain } from '@teambit/babel';
import { BuildContext, BuiltTaskResult } from '@teambit/builder';
import {
  CompilationInitiator,
  Compiler,
  CompilerOptions,
  TranspileComponentParams,
  TranspileFileOutput,
  TranspileFileParams
} from '@teambit/compiler';
import { Component } from '@teambit/component';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { NgPackagrCompiler } from '@teambit/ng-packagr';
import minimatch from 'minimatch';

const presets = [
  require.resolve('@babel/preset-env'),
  require.resolve('@babel/preset-typescript')
];
const plugins = [require.resolve('@babel/plugin-proposal-class-properties')];

export interface NgMultiCompilerOptions {
  bitCompilerOptions?: Partial<CompilerOptions>;
  name?: string;
  ngEnvOptions: AngularEnvOptions;
  tsCompilerOptions?: AngularCompilerOptions;
}

export class NgMultiCompiler implements Compiler {
  readonly id = 'teambit.angular/dev-services/compiler/ng-multi-compiler';
  mainCompiler: NgPackagrCompiler | AngularElementsCompiler;

  private constructor(
    public displayName = 'angular-multi-compiler',
    private babelMain: BabelMain,
    private application: ApplicationMain,
    private ngEnvOptions: AngularEnvOptions,
    private ngPackagrCompiler: NgPackagrCompiler,
    private angularElementsCompiler: AngularElementsCompiler | undefined,
    public distDir = 'dist',
  ) {
    if (this.ngEnvOptions.useAngularElementsPreview && this.angularElementsCompiler) {
      this.mainCompiler = this.angularElementsCompiler;
    } else {
      this.mainCompiler = this.ngPackagrCompiler;
    }
  }

  private _babelCompiler!: BabelCompiler;
  get babelCompiler(): BabelCompiler {
    if (!this._babelCompiler) {
      this._babelCompiler = this.babelMain.createCompiler({
        babelTransformOptions: {
          presets,
          plugins,
          sourceMaps: true
        }, shouldCopyNonSupportedFiles: false, supportedFilesGlobPatterns: [NG_APP_PATTERN]
      });
    }
    return this._babelCompiler;
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
    if (params.initiator === CompilationInitiator.PreStart || params.initiator === CompilationInitiator.Start) {
      return this.mainCompiler.transpileComponent(params);
    } else {
      return this.ngPackagrCompiler.transpileComponent(params);
    }
  }

  transpileFile(fileContent: string, params: TranspileFileParams): TranspileFileOutput {
    if (minimatch(params.filePath, NG_APP_PATTERN)) {
      return this.babelCompiler.transpileFile(fileContent, params);
    }
    return null;
  }

  /**
   * used by `bit build`
   */
  async build(context: BuildContext): Promise<BuiltTaskResult> {
    const result = await this.ngPackagrCompiler.build(context);
    if (this.ngEnvOptions.useAngularElementsPreview && this.angularElementsCompiler) {
      return this.angularElementsCompiler.build(context);
    }
    return result;
  }

  /**
   * return the dist dir of the compiled files (relative path from the component root dir)
   */
  getDistDir() {
    return this.distDir;
  }

  /**
   * given a source file, return its parallel in the dists. e.g. index.ts => dist/index.js
   * used by `bit build` & `bit start` for compositions & doc files
   */
  getDistPathBySrcPath(srcPath: string): string {
    if (minimatch(srcPath, NG_APP_PATTERN)) {
      return this.babelCompiler.getDistPathBySrcPath(srcPath);
    }
    return this.mainCompiler.getDistPathBySrcPath(srcPath);
  }

  /**
   * given a component, returns the path to the source folder to use for the preview, uses the one
   * in node_modules by default
   * used by `bit start`
   */
  getPreviewComponentRootPath(component: Component): string {
    return this.mainCompiler.getPreviewComponentRootPath(component);
  }

  /**
   * whether the compiler is able to compile the given path
   */
  isFileSupported(filePath: string): boolean {
    if (minimatch(filePath, NG_APP_PATTERN)) {
      return this.babelCompiler.isFileSupported(filePath);
    }
    return this.mainCompiler.isFileSupported(filePath);
  }

  version(): string {
    return this.mainCompiler.version();
  }

  static from(options: NgMultiCompilerOptions): EnvHandler<NgMultiCompiler> {
    return (context: EnvContext) => {
      const name = options.name || 'angular-multi-compiler';
      const ngPackagrModulePath = options.ngEnvOptions.ngPackagrModulePath || require.resolve('ng-packagr');
      const distDir = options.bitCompilerOptions?.distDir ?? 'dist';
      const distGlobPatterns = options.bitCompilerOptions?.distGlobPatterns ?? [`${distDir}/**`];
      const shouldCopyNonSupportedFiles = options.bitCompilerOptions?.shouldCopyNonSupportedFiles ?? false;
      const artifactName = options.bitCompilerOptions?.artifactName ?? 'dist';
      const babelMain = context.getAspect<BabelMain>(BabelAspect.id);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);

      const ngPackagrCompiler = NgPackagrCompiler.from({
        artifactName: artifactName,
        distDir: distDir,
        distGlobPatterns: distGlobPatterns,
        ngEnvOptions: options.ngEnvOptions,
        ngPackagrModulePath,
        shouldCopyNonSupportedFiles: shouldCopyNonSupportedFiles,
        tsCompilerOptions: options.tsCompilerOptions
      })(context);

      let angularElementsCompiler: AngularElementsCompiler | undefined;

      if (options.ngEnvOptions.useAngularElementsPreview) {
        angularElementsCompiler = AngularElementsCompiler.from({
          artifactName,
          distDir,
          distGlobPatterns,
          ngEnvOptions: options.ngEnvOptions,
          shouldCopyNonSupportedFiles,
          tsCompilerOptions: options.tsCompilerOptions
        })(context);
      }

      return new NgMultiCompiler(
        name,
        babelMain,
        application,
        options.ngEnvOptions,
        ngPackagrCompiler,
        angularElementsCompiler,
        distDir,
      );
    };
  }
}

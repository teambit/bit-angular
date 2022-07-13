import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { componentIsApp, NG_APP_PATTERN } from '@teambit/angular-apps';
import { AngularElementsCompiler } from '@teambit/angular-elements';
import { ApplicationMain } from '@teambit/application';
import { BabelCompiler, BabelMain } from '@teambit/babel';
import { BuildContext, BuiltTaskResult } from '@teambit/builder';
import {
  CompilationInitiator,
  Compiler,
  CompilerOptions,
  TranspileComponentParams,
  TranspileFileParams,
  TranspileFileOutput
} from '@teambit/compiler';
import { Component } from '@teambit/component';
import { CompositionsMain } from '@teambit/compositions';
import { Logger } from '@teambit/logger';
import { NgPackagrCompiler } from '@teambit/ng-packagr';
import { Workspace } from '@teambit/workspace';
import minimatch from 'minimatch';

const presets = [
  require.resolve('@babel/preset-env'),
  require.resolve('@babel/preset-typescript')
];
const plugins = [require.resolve('@babel/plugin-proposal-class-properties')];

export class NgMultiCompiler implements Compiler {
  readonly id = 'teambit.angular/dev-services/compiler/ng-multi-compiler';
  displayName = 'Angular multi-compiler';
  distDir: string;
  distGlobPatterns: string[];
  shouldCopyNonSupportedFiles: boolean;
  artifactName: string;
  ngPackagrCompiler: NgPackagrCompiler;
  angularElementsCompiler: AngularElementsCompiler | undefined;
  mainCompiler: NgPackagrCompiler | AngularElementsCompiler;

  constructor(
    ngPackagrPath: string,
    private useElements: boolean,
    private babelMain: BabelMain,
    readDefaultTsConfig: string,
    private logger: Logger,
    private workspace: Workspace | undefined,
    private compositions: CompositionsMain,
    private application: ApplicationMain,
    private tsCompilerOptions: AngularCompilerOptions = {},
    bitCompilerOptions: Partial<CompilerOptions> = {},
    private nodeModulesPaths: string[] = []
  ) {
    this.distDir = bitCompilerOptions.distDir || 'dist';
    this.distGlobPatterns = bitCompilerOptions.distGlobPatterns || [`${this.distDir}/**`];
    this.shouldCopyNonSupportedFiles =
      typeof bitCompilerOptions.shouldCopyNonSupportedFiles === 'boolean' ? bitCompilerOptions.shouldCopyNonSupportedFiles : true;
    this.artifactName = bitCompilerOptions.artifactName || 'dist';
    this.ngPackagrCompiler = new NgPackagrCompiler(
      ngPackagrPath,
      readDefaultTsConfig,
      this.logger,
      this.workspace,
      this.compositions,
      this.application,
      this.distDir,
      this.distGlobPatterns,
      this.shouldCopyNonSupportedFiles,
      this.artifactName,
      tsCompilerOptions,
      nodeModulesPaths
    ) as NgPackagrCompiler;

    if (this.useElements) {
      this.angularElementsCompiler = new AngularElementsCompiler(
        this.logger,
        this.workspace,
        this.compositions,
        this.application,
        this.distDir,
        this.distGlobPatterns,
        this.shouldCopyNonSupportedFiles,
        this.artifactName,
        tsCompilerOptions,
        nodeModulesPaths
      ) as AngularElementsCompiler;
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
    if (this.useElements && this.angularElementsCompiler) {
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
}

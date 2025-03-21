// @ts-ignore
import type { AngularCompilerOptions } from '@angular/compiler-cli';
import {
  AngularEnvOptions,
  componentIsApp,
  getWorkspace,
  NG_APP_PATTERN,
  NG_ELEMENTS_PATTERN
} from '@bitdev/angular.dev-services.common';
import { AngularElementsCompiler } from '@bitdev/angular.dev-services.compiler.elements';
import { NgPackagrCompiler } from '@bitdev/angular.dev-services.compiler.ng-packagr';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { ArtifactDefinition, BuildContext, BuiltTaskResult, ComponentResult } from '@teambit/builder';
import {
  Compiler,
  CompilerOptions,
  TranspileComponentParams,
  TranspileFileOutput,
  TranspileFileOutputOneFile,
  TranspileFileParams
} from '@teambit/compiler';
import { Component } from '@teambit/component';
import { EnvContext, EnvHandler } from '@teambit/envs';
import pkgModules from '@teambit/pkg.modules.component-package-name';
import { PathOsBasedRelative } from '@teambit/toolbox.path.path';
import { TypescriptCompiler } from '@teambit/typescript.typescript-compiler';
import { Workspace } from '@teambit/workspace';
import { readRootComponentsDir } from '@teambit/workspace.root-components';
import fs from 'fs-extra';
import minimatch from 'minimatch';
import { createRequire } from "node:module";
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from "path";

export interface NgMultiCompilerOptions {
  bitCompilerOptions?: Partial<CompilerOptions>;
  name?: string;
  ngEnvOptions: AngularEnvOptions;
  tsCompilerOptions?: AngularCompilerOptions;
  tsconfigPath?: string;
}

const require = createRequire(import.meta.url);

export class NgMultiCompiler implements Compiler {
  readonly id = 'bitdev.angular/dev-services/compiler/multi-compiler';

  private constructor(
    public displayName = 'angular-multi-compiler',
    private tsCompiler: Compiler,
    private application: ApplicationMain,
    private workspace: Workspace,
    private ngPackagrCompiler: NgPackagrCompiler,
    private angularElementsCompiler: AngularElementsCompiler | undefined,
    public artifactName: string,
    public distGlobPatterns: string[],
    public distDir = 'dist'
  ) {
  }

  private getArtifactDefinition(): ArtifactDefinition[] {
    return [{
      generatedBy: this.id,
      name: this.artifactName,
      globPatterns: this.distGlobPatterns
    }];
  }

  private async getInjectedDirs(packageName: string, component: Component): Promise<string[]> {
    const injectedDirs = await this.workspace.getInjectedDirs(component);
    if (injectedDirs.length > 0) {
      return injectedDirs;
    }

    const rootDirs = await readRootComponentsDir(this.workspace.rootComponentsPath);
    return rootDirs.map((rootDir) => path.relative(this.workspace.path, path.join(rootDir, packageName)));
  }

  private async distDirs(component: Component): Promise<PathOsBasedRelative[]> {
    const packageName = pkgModules.componentIdToPackageName(component.state._consumer);
    const packageDir = path.join('node_modules', packageName);
    const injectedDirs = await this.getInjectedDirs(packageName, component);
    return [packageDir, ...injectedDirs].map((dist) => path.join(this.workspace.path, dist, this.distDir));
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

    // Create dist if it doesn't exist to avoid a warning with `bit status`
    const dist = join(params.outputDir, this.distDir);
    fs.mkdirsSync(dist);

    // When using Angular elements, we need to compile components locally, not just for build
    if (minimatch(params.component.config.main, NG_ELEMENTS_PATTERN)) {
      const distDirs = await this.distDirs(params.component);
      return this.angularElementsCompiler!.transpileComponent(params, distDirs);
    }
  }

  transpileFile(fileContent: string, params: TranspileFileParams): TranspileFileOutput | Promise<TranspileFileOutput> {
    if (minimatch(params.filePath, NG_APP_PATTERN)) {
      return this.tsCompiler.transpileFile!(fileContent, params);
    }
    return null;
  }

  async compileAppEntryFile(appComponent: Component, appComponentDir: string): Promise<TranspileFileOutput> {
    const appEntryFile = appComponent.state.filesystem.files.find(file => minimatch(file.relative, NG_APP_PATTERN))!;
    const transpileFileOutput = await this.transpileFile(appEntryFile.contents.toString(), {
      filePath: appEntryFile.relative,
      componentDir: appComponentDir
    });
    const distPath = join(appComponentDir, this.distDir);
    transpileFileOutput?.forEach((fileOutput: TranspileFileOutputOneFile) => {
      fs.outputFileSync(join(distPath, fileOutput.outputPath), fileOutput.outputText);
    });
    return transpileFileOutput;
  }

  /**
   * used by `bit build`
   */
  async build(context: BuildContext): Promise<BuiltTaskResult> {
    const componentsResults: ComponentResult[] = [];
    const capsules = context.capsuleNetwork.seedersCapsules;
    // compile all app entry files with babel
    const appComponentCapsules = capsules.filter(capsule => componentIsApp(capsule.component, this.application));
    for (const capsule of appComponentCapsules) {
      const appComponent = capsule.component;
      await this.compileAppEntryFile(appComponent, capsule.path);
      componentsResults.push({ component: appComponent });
    }

    // compile Angular elements components
    const angularElementsResult = await this.angularElementsCompiler!.build(context);
    componentsResults.push(...angularElementsResult.componentsResults);

    // compile all the other components with ng-packagr
    const ngPackagrResult = await this.ngPackagrCompiler.build(context);
    componentsResults.push(...ngPackagrResult.componentsResults);

    return {
      artifacts: this.getArtifactDefinition(),
      componentsResults
    };
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
      return this.tsCompiler.getDistPathBySrcPath(srcPath);
    }
    return this.ngPackagrCompiler.getDistPathBySrcPath(srcPath);
  }

  /**
   * given a component, returns the path to the source folder to use for the preview, uses the one
   * in node_modules by default
   * used by `bit start`
   */
  getPreviewComponentRootPath(component: Component): string {
    return this.ngPackagrCompiler.getPreviewComponentRootPath(component);
  }

  /**
   * whether the compiler is able to compile the given path
   */
  isFileSupported(filePath: string): boolean {
    if (minimatch(filePath, NG_APP_PATTERN)) {
      return this.tsCompiler.isFileSupported(filePath);
    }
    return this.ngPackagrCompiler.isFileSupported(filePath);
  }

  version(): string {
    return this.ngPackagrCompiler.version();
  }

  static from(options: NgMultiCompilerOptions): EnvHandler<NgMultiCompiler> {
    return (context: EnvContext) => {
      const name = options.name || 'angular-multi-compiler';
      const ngPackagrModulePath = options.ngEnvOptions.ngPackagrModulePath || import.meta.resolve('ng-packagr');
      const distDir = options.bitCompilerOptions?.distDir ?? 'dist';
      const distGlobPatterns = options.bitCompilerOptions?.distGlobPatterns ?? [`${distDir}/**`];
      const shouldCopyNonSupportedFiles = options.bitCompilerOptions?.shouldCopyNonSupportedFiles ?? false;
      const artifactName = options.bitCompilerOptions?.artifactName ?? 'dist';
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const workspace = getWorkspace(context);
      const tsCompiler: Compiler = TypescriptCompiler.from({
        esm: true,
        tsconfig: fileURLToPath(import.meta.resolve('./config/tsconfig.json'))
      })(context);

      const ngPackagrCompiler = NgPackagrCompiler.from({
        artifactName,
        distDir,
        distGlobPatterns,
        ngPackagrModulePath,
        shouldCopyNonSupportedFiles,
        tsCompilerOptions: options.tsCompilerOptions,
        tsconfigPath: options.tsconfigPath
      })(context);

      const angularElementsCompiler = AngularElementsCompiler.from({
        artifactName,
        distDir,
        distGlobPatterns,
        shouldCopyNonSupportedFiles,
        tsCompilerOptions: options.tsCompilerOptions,
        tsconfigPath: options.tsconfigPath || require.resolve('./config/tsconfig.json')
      })(context);

      return new NgMultiCompiler(
        name,
        tsCompiler,
        application,
        workspace,
        ngPackagrCompiler,
        angularElementsCompiler,
        artifactName,
        distGlobPatterns,
        distDir
      );
    };
  }
}

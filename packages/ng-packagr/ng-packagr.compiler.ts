import { ParsedConfiguration, CompilerOptions as TsCompilerOptions } from '@angular/compiler-cli';
import { BuildContext, BuiltTaskResult, ComponentResult } from '@teambit/builder';
import { Compiler, CompilerOptions, TranspileComponentParams, CompilationInitiator } from '@teambit/compiler';
import { Component } from '@teambit/component';
import PackageJsonFile from '@teambit/legacy/dist/consumer/component/package-json-file';
import AbstractVinyl from '@teambit/legacy/dist/consumer/component/sources/abstract-vinyl';
import DataToPersist from '@teambit/legacy/dist/consumer/component/sources/data-to-persist';
import { HarmonyWorker } from '@teambit/legacy/dist/scopes/harmony/worker';
import { stringify } from 'flatted';
import { Logger } from '@teambit/logger';
import { Workspace } from '@teambit/workspace';
import { extname, join } from 'path';
import type { NgPackagrWorker } from './ng-packagr.worker';

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


export class NgPackagrCompiler implements Compiler {
  displayName = 'NgPackagr compiler';
  distDir: string;
  distGlobPatterns: string[];
  shouldCopyNonSupportedFiles: boolean;
  artifactName: string;

  constructor(
    readonly id: string,
    private ngPackagr: string,
    private ngPackagrWorker: HarmonyWorker<NgPackagrWorker>,
    private logger: Logger,
    private workspace: Workspace,
    private readDefaultTsConfig: string,
    private tsCompilerOptions: TsCompilerOptions = {},
    private bitCompilerOptions: Partial<CompilerOptions> = {},
    private nodeModulesPaths: string[] = []
  ) {
    this.distDir = bitCompilerOptions.distDir || 'dist';
    this.distGlobPatterns = bitCompilerOptions.distGlobPatterns || [`${this.distDir}/**`];
    this.shouldCopyNonSupportedFiles =
      typeof bitCompilerOptions.shouldCopyNonSupportedFiles === 'boolean' ? bitCompilerOptions.shouldCopyNonSupportedFiles : true;
    this.artifactName = bitCompilerOptions.artifactName || 'dist';
  }

  initiateWorker(log: boolean): NgPackagrWorker {
    const workerApi = this.ngPackagrWorker.initiate(
      log ? { stdout: false, stderr: false, stdin: false } : { stdout: true, stderr: true, stdin: false }
    );
    workerApi.setup(this.ngPackagr, this.readDefaultTsConfig, this.distDir, stringify(this.nodeModulesPaths));
    return workerApi;
  }

  /**
   * used by `bit compile`
   */
  async transpileComponent(params: TranspileComponentParams): Promise<void> {
    if(params.initiator === CompilationInitiator.PreStart || params.initiator === CompilationInitiator.Start) {
      return;
    }
    const bgCompilation = params.initiator === CompilationInitiator.ComponentChanged;
    const ngPackagrWorker = this.initiateWorker(!bgCompilation);
    // recreate packageJson from component to make sure that its dependencies are updated with recent code changes
    const packageJson = PackageJsonFile.createFromComponent('', params.component);
    packageJson.workspaceDir = params.outputDir;
    await packageJson.write();
    if(bgCompilation) {
      // if it's in the background, we don't wait for the promise to resolve
      void ngPackagrWorker.ngPackagrCompilation(params.componentDir, params.outputDir, stringify(this.tsCompilerOptions));
    } else {
      // disable logger temporarily so that it doesn't mess up with ngPackagr logs
      this.logger.off();
      // if it's not in the background, we wait for the promise to resolve
      await ngPackagrWorker.ngPackagrCompilation(params.componentDir, params.outputDir, stringify(this.tsCompilerOptions));
      this.logger.on();
    }
  }

  private getArtifactDefinition() {
    return [
      {
        generatedBy: this.id,
        name: this.artifactName,
        globPatterns: this.distGlobPatterns,
      },
    ];
  }

  /**
   * used by `bit build`
   */
  async build(context: BuildContext): Promise<BuiltTaskResult> {
    const capsules = context.capsuleNetwork.seedersCapsules;
    const componentsResults: ComponentResult[] = [];

    await Promise.all(
      context.components.map(async (component: Component) => {
        const capsule = capsules.getCapsule(component.id);
        if (!capsule) {
          throw new Error(`No capsule found for ${component.id} in network graph`);
        }
        const currentComponentResult: ComponentResult = {
          component,
        };
        try {
          const ngPackagrWorker = this.initiateWorker(true);
          // disable logger temporarily so that it doesn't mess up with ngPackagr logs
          this.logger.off();
          await ngPackagrWorker.ngPackagrCompilation(capsule.path, capsule.path, stringify(this.tsCompilerOptions));
          this.logger.on();
        } catch (e: any) {
          currentComponentResult.errors = [e];
        }

        if (this.shouldCopyNonSupportedFiles) {
          const dataToPersist = new DataToPersist();
          capsule.component.filesystem.files.forEach((file: AbstractVinyl) => {
            if (!this.isFileSupported(file.path)) {
              dataToPersist.addFile(file);
            }
          });
          dataToPersist.addBasePath(join(capsule.path, this.distDir));
          await dataToPersist.persistAllToFS();
        }

        componentsResults.push({ ...currentComponentResult });
      })
    );

    return {
      artifacts: this.getArtifactDefinition(),
      componentsResults,
    };
  }

  /**
   * given a source file, return its parallel in the dists. e.g. index.ts => dist/index.js
   * used by `bit build`
   */
  getDistPathBySrcPath(srcPath: string): string {
    // we use the typescript compiler, so we just need to return the typescript src file path
    return srcPath;
  }

  /**
   * given a component, returns the path to the source folder to use for the preview, uses the one
   * in node_modules by default
   * used by `bit start`
   */
  getPreviewComponentRootPath?(component: Component): string {
    return this.workspace.componentDir(component.id, {ignoreScopeAndVersion: true, ignoreVersion: true}, {relative: true});
  }

  /**
   * whether ngPackagr is able to compile the given path
   */
  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.ts') || (!!this.tsCompilerOptions.allowJs && filePath.endsWith('.js'));
  }

  private replaceFileExtToJs(filePath: string): string {
    if (!this.isFileSupported(filePath)) return filePath;
    const fileExtension = extname(filePath);
    return filePath.replace(new RegExp(`${fileExtension}$`), '.js'); // makes sure it's the last occurrence
  }

  version(): string {
    // eslint-disable-next-line global-require
    return require('ng-packagr/package.json').version;
  }
}

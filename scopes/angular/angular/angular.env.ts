import { BuildTask } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerMain, CompilerOptions } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
import {
  BuilderEnv,
  DependenciesEnv,
  DevEnv,
  EnvDescriptor,
  LinterEnv,
  TesterEnv
} from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { Linter } from '@teambit/linter';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { PkgMain } from '@teambit/pkg';
import { Tester, TesterMain } from '@teambit/tester';
import { TsCompilerOptionsWithoutTsConfig, TypescriptMain } from '@teambit/typescript';
import { WebpackConfigTransformer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import * as jestM from 'jest';
import { TsConfigSourceFile } from 'typescript';
import { AngularVersionAdapter } from './angular-version-adapter';
import { AngularAspect } from './angular.aspect';
import { AngularDevServer } from './angular.dev-server';
import { AngularMainConfig } from './angular.main.runtime';
import { eslintConfig } from './eslint/eslintrc';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularEnv implements BuilderEnv, LinterEnv, DependenciesEnv, DevEnv, TesterEnv {
  name = 'Angular';
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';
  adapter!: AngularVersionAdapter;

  constructor(
    private config: AngularMainConfig,
    private jestAspect: JestMain,
    private tsAspect: TypescriptMain,
    private compiler: CompilerMain,
    private webpack: WebpackMain,
    private workspace: Workspace,
    private pkg: PkgMain,
    private tester: TesterMain,
    private eslint: ESLintMain,
    private ngPackagrAspect: NgPackagrMain,
    private compositions: CompositionsMain
  ) {}

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular',
    };
  }

  /**
   * Load the adapter with the correct implementation based on the selection version of Angular
   */
  async useVersion(version = 12) {
    switch (version) {
      case 11:
        const AngularV11 = (await import("@teambit/angular-v11")).default;
        this.adapter = new AngularV11();
        break;
      case 12:
      default:
        const AngularV12 = (await import("@teambit/angular-v12")).default;
        this.adapter = new AngularV12();
    }
  }

  private createNgPackgrCompiler(tsconfig?: TsConfigSourceFile, compilerOptions: Partial<CompilerOptions> = {}) {
    return this.ngPackagrAspect.createCompiler(this.adapter.ngPackagr, tsconfig, {
      ...compilerOptions,
    });
  }

  getCompiler(tsconfig?: TsConfigSourceFile, compilerOptions: Partial<TsCompilerOptionsWithoutTsConfig> = {}) {
    return this.createNgPackgrCompiler(tsconfig, compilerOptions);
  }

  private getCompilerTask(
    tsconfig?: TsConfigSourceFile,
    compilerOptions: Partial<TsCompilerOptionsWithoutTsConfig> = {}
  ) {
    return this.compiler.createTask('NgPackagrCompiler', this.getCompiler(tsconfig, compilerOptions));
  }

  /**
   * Returns the component build pipeline
   * Required for `bit build`
   */
  getBuildPipe(
    tsconfig?: TsConfigSourceFile,
    compilerOptions: Partial<TsCompilerOptionsWithoutTsConfig> = {}
  ): BuildTask[] {
    return [this.getCompilerTask(tsconfig, compilerOptions)];
  }

  /**
   * Returns a paths to a function which mounts a given component to DOM
   * Required for `bit build`
   */
  getMounter() {
    return require.resolve('./preview/src/mount');
  }

  /**
   * Returns a path to a docs template.
   * Required for `bit build`
   */
  getDocsTemplate() {
    return require.resolve('./preview/src/docs');
  }

  /**
   * Returns a bundler for the preview.
   * Required for `bit build` & `build start`
   */
  async getBundler(context: BundlerContext, transformers: any[]): Promise<Bundler> {
    // throw new Error('done');
    // const defaultConfig = previewConfigFactory(path);
    // const defaultTransformer: WebpackConfigTransformer = (configMutator) => {
    //   return configMutator.merge([defaultConfig]);
    // };
    //
    // return this.webpack.createBundler(context, [defaultTransformer, ...transformers]);
    return null as any;
  }

  /**
   * Returns and configures the component linter.
   * Required for `bit lint`
   */
  getLinter(): Linter {
    return this.eslint.createLinter({
      config: eslintConfig,
      // resolve all plugins from the angular environment.
      pluginPath: __dirname,
    });
  }

  /**
   * Returns a tester
   * Required for `bit start` & `bit test`
   */
  getTester(jestConfigPath: string): Tester {
    const config = jestConfigPath || require.resolve('./jest/jest.config');
    return this.jestAspect.createTester(config, jestM);
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularAspect.id;
    return id || AngularAspect.id;
  }

  /**
   * Returns and configures the dev server.
   * Required for `bit start`
   */
  async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    return new AngularDevServer(this.workspace, this.webpack, this.adapter, this.compositions).createDevServer(context, transformers);
  }

  /**
   * Returns the list of dependencies
   * Required for any task
   */
  async getDependencies() {
    return this.adapter.dependencies;
  }
}

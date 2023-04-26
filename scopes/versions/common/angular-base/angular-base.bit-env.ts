import { AngularAppType, NG_APP_NAME } from '@teambit/angular-apps';
import { AngularEnvOptions, BrowserOptions, DevServerOptions } from '@teambit/angular-common';
import { AngularPreview, BundlerProvider, DevServerProvider } from '@teambit/angular-preview';
import { NgWorkspaceTemplate } from '@teambit/angular-starters';
import { NgAppTemplate, NgEnvTemplate, NgModuleTemplate } from '@teambit/angular-templates';
import { NgWebpackBundler, NgWebpackDevServer } from '@teambit/angular-webpack';
import { AppTypeList } from '@teambit/application';
import { Pipeline } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Compiler } from '@teambit/compiler';
import { ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { JestTask, JestTester } from '@teambit/defender.jest-tester';
import { PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { AsyncEnvHandler, EnvHandler } from '@teambit/envs';
import { Formatter } from '@teambit/formatter';
import { StarterList, TemplateList } from '@teambit/generator';
import { Linter } from '@teambit/linter';
import { NgMultiCompiler, NgMultiCompilerTask } from '@teambit/ng-multi-compiler';
import { PackageGenerator } from '@teambit/pkg';
import { Preview } from '@teambit/preview';
import { SchemaExtractor } from '@teambit/schema';
import { Tester } from '@teambit/tester';
import { TypeScriptExtractor } from '@teambit/typescript';
import { WebpackConfigTransformer, WebpackConfigWithDevServer } from '@teambit/webpack';
import { ESLint as ESLintLib } from 'eslint';
import { merge } from 'lodash';
import { Configuration } from 'webpack';
import { AngularEnvInterface } from './angular-env.interface';

/**
 * a component environment built for [Angular](https://angular.io).
 */
  export abstract class AngularBaseEnv implements AngularEnvInterface {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';
  private ngMultiCompiler: EnvHandler<NgMultiCompiler> | undefined;

  /** Abstract functions & properties specific to the adapter **/
  abstract ngEnvOptions: AngularEnvOptions;
  abstract name: string;
  abstract readonly angularVersion: number;

  [key: string]: any;

  public getNgEnvOptions(): AngularEnvOptions {
    return Object.assign({}, this.ngEnvOptions);
  }

  /**
   * Deeply merge the given options with the existing/default options
   */
  public setNgEnvOptions(...ngEnvOptions: Partial<AngularEnvOptions>[]): void {
    this.ngEnvOptions = merge(this.ngEnvOptions || {}, ...ngEnvOptions);
    // TODO check if we need to run ngcc
    // if (this.ngEnvOptions.useNgcc) {
    //   this.depResolver.registerPostInstallSubscribers([this.postInstall.bind(this)]);
    // }
  }

  /**
   * define the build pipeline for a component.
   * pipelines are optimized for performance and consistency.
   * making sure every component is independently built and tested.
   */
  build(): Pipeline {
    return Pipeline.from([
      NgMultiCompilerTask.from({ ngMultiCompiler: this.compiler() }),
      EslintTask.from(this.getLinterConfig()),
      JestTask.from(this.getTesterConfig())
    ]);
  }

  /**
   * Returns an instance of the compiler
   * Required for making and reading dists, especially for `bit compile`
   */
  compiler(): EnvHandler<Compiler> {
    if (!this.ngMultiCompiler) {
      this.ngMultiCompiler = NgMultiCompiler.from({
        ngEnvOptions: this.getNgEnvOptions()
      });
    }
    return this.ngMultiCompiler;
  }

  formatter(): EnvHandler<Formatter> {
    return PrettierFormatter.from({
      configPath: require.resolve('./config/prettier.config')
    });
  }

  getLinterConfig(): any {
    return {
      tsconfig: require.resolve('@teambit/angular-eslint-config/config/tsconfig.json'),
      eslint: ESLintLib,
      configPath: require.resolve('./config/eslintrc'),
      // resolve all plugins from the angular environment.
      pluginsPath: __dirname,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs']
    };
  }

  /**
   * returns an instance of the default ESLint.
   * config files would be used to validate coding standards in components.
   * bit will write the minimum required files in any workspace to optimize
   * for dev experience.
   */
  linter(): EnvHandler<Linter> {
    return ESLintLinter.from(this.getLinterConfig());
  }

  /**
   * configure and control the packaging process of components.
   */
  package() {
    return PackageGenerator.from({
      packageJson: {},
      npmIgnore: []
    });
  }

  getDevServer(
    devServerContext: DevServerContext,
    ngEnvOptions: AngularEnvOptions,
    transformers: WebpackConfigTransformer[] = [],
    angularOptions: Partial<BrowserOptions & DevServerOptions> = {},
    webpackOptions: Partial<WebpackConfigWithDevServer | Configuration> = {},
    sourceRoot?: string
  ): AsyncEnvHandler<DevServer> {
    return NgWebpackDevServer.from({
      angularOptions,
      devServerContext,
      ngEnvOptions,
      sourceRoot,
      transformers,
      webpackOptions
    });
  }

  getBundler(
    bundlerContext: BundlerContext,
    ngEnvOptions: AngularEnvOptions,
    transformers: WebpackConfigTransformer[] = [],
    angularOptions: Partial<BrowserOptions & DevServerOptions> = {},
    webpackOptions: Partial<WebpackConfigWithDevServer | Configuration> = {},
    sourceRoot?: string
  ): AsyncEnvHandler<Bundler> {
    return NgWebpackBundler.from({
      angularOptions,
      bundlerContext,
      ngEnvOptions,
      sourceRoot,
      transformers,
      webpackOptions
    });
  }

  preview(): EnvHandler<Preview> {
    const ngEnvOptions = this.getNgEnvOptions();
    const devServerProvider: DevServerProvider = (devServerContext: DevServerContext) => this.getDevServer(devServerContext, ngEnvOptions);
    const bundlerProvider: BundlerProvider = (bundlerContext: BundlerContext) => this.getBundler(bundlerContext, ngEnvOptions);
    return AngularPreview.from({
      devServerProvider,
      bundlerProvider,
      ngEnvOptions
    });
  }

  /**
   * returns an instance of the default TypeScript extractor.
   * used by default for type inference for both JS and TS.
   */
  schemaExtractor(): EnvHandler<SchemaExtractor> {
    return TypeScriptExtractor.from({
      tsconfig: require.resolve('./config/tsconfig.json'),
    });
  }

  /**
   * add build tasks to execute upon [snap](https://bit.dev/docs/snaps).
   * use the snap pipeline for staging and test deployments
   */
  snap() {
    return Pipeline.from([]);
  }

  /**
   * Defines the component generators (templates) available with the command `bit templates`.
   * @see https://bit.dev/docs/angular-env/component-generators
   */
  generators(): EnvHandler<TemplateList> {
    const envName = this.constructor.name;
    const angularVersion = this.angularVersion;
    return TemplateList.from([
      NgModuleTemplate.from({envName, angularVersion}),
      NgEnvTemplate.from({envName, angularVersion}),
      NgAppTemplate.from({envName, angularVersion})
    ]);
  }

  /**
   * Defines the Angular workspace starters available with the command `bit new`.
   * @see https://bit.dev/docs/angular-env/workspace-starters
   */
  starters(): EnvHandler<StarterList> {
    return StarterList.from([
      NgWorkspaceTemplate.from({envName: this.constructor.name, angularVersion: this.angularVersion})
    ]);
  }

  /**
   * add build tasks to execute upon [tag](https://bit.dev/docs/tags).
   * use the tag pipeline for deployments, or other tasks required for
   * publishing a semantic version for a component.
   */
  tag() {
    return Pipeline.from([]);
  }

  getTesterConfig() {
    const ngEnvOptions = this.getNgEnvOptions();
    return {
      jest: ngEnvOptions.jestModulePath,
      config: ngEnvOptions.jestConfigPath
    };
  }

  /**
   * Returns a tester
   * Required for `bit start` & `bit test`
   */
  tester(): EnvHandler<Tester> {
    return JestTester.from(this.getTesterConfig());
  }

  apps(): EnvHandler<AppTypeList> {
    return AppTypeList.from([AngularAppType.from({angularEnv: this, name: NG_APP_NAME})]);
  }
}

import { AngularAppType } from '@bitdev/angular.app-types.angular-app-type';
import {
  AngularEnvOptions,
  BrowserOptions,
  DevServerOptions,
  NG_APP_NAME
} from '@bitdev/angular.dev-services.common';
import {
  NgMultiCompiler,
  NgMultiCompilerTask
} from '@bitdev/angular.dev-services.compiler.multi-compiler';
import {
  AngularPreview,
  BundlerProvider,
  DevServerProvider
} from '@bitdev/angular.dev-services.preview.preview';
import { NgWebpackBundler, NgWebpackDevServer } from '@bitdev/angular.dev-services.webpack';
import {
  NgAppTemplate,
  NgEnvTemplate,
  NgModuleTemplate,
  NgStandaloneTemplate
} from '@bitdev/angular.templates.generators';
import {
  AngularStarter,
  DesignSystemStarter,
  MaterialDesignSystemStarter
} from '@bitdev/angular.templates.starters';
import { AppTypeList } from '@teambit/application';
import { Pipeline } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Compiler } from '@teambit/compiler';
import { EslintConfigWriter, ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { JestTask, JestTester } from '@teambit/defender.jest-tester';
import { PrettierConfigWriter, PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { AsyncEnvHandler, EnvHandler } from '@teambit/envs';
import { Formatter } from '@teambit/formatter';
import { StarterList, TemplateList } from '@teambit/generator';
import { Linter } from '@teambit/linter';
import { PackageGenerator } from '@teambit/pkg';
import { Preview } from '@teambit/preview';
import { SchemaExtractor } from '@teambit/schema';
import { Tester } from '@teambit/tester';
import { TypeScriptExtractor } from '@teambit/typescript';
import { TypescriptConfigWriter } from '@teambit/typescript.typescript-compiler';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { ConfigWriterList } from '@teambit/workspace-config-files';
import { ESLint as ESLintLib } from 'eslint';
import { merge } from 'lodash';
import { AngularEnvInterface } from './angular-env.interface';
import hostDependencies from './preview/host-dependencies';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularBaseEnv implements AngularEnvInterface {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';

  private ngMultiCompiler: EnvHandler<NgMultiCompiler> | undefined;

  /** Abstract functions & properties specific to the adapter * */
  abstract ngEnvOptions: AngularEnvOptions;

  abstract name: string;

  abstract readonly angularVersion: number;

  [key: string]: any;

  public getNgEnvOptions(): AngularEnvOptions {
    return { ...this.ngEnvOptions };
  }

  /**
   * Deeply merge the given options with the existing/default options
   */
  public setNgEnvOptions(...ngEnvOptions: Partial<AngularEnvOptions>[]): void {
    this.ngEnvOptions = merge(this.ngEnvOptions || {}, ...ngEnvOptions);
    if (this.ngEnvOptions.devServer === 'vite' && this.angularVersion < 16) {
      throw new Error(`Vite dev server is only supported for Angular 16+`);
    }
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
      tsconfig: require.resolve('@bitdev/angular.dev-services.linter.eslint/config/tsconfig.json'),
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
    webpackOptions: any = {},
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
    webpackOptions: any = {},
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
    const devServerProvider: DevServerProvider = (
      devServerContext: DevServerContext,
      transformers: WebpackConfigTransformer[] = [],
      angularOptions: Partial<BrowserOptions & DevServerOptions> = {},
      webpackOptions: any = {},
      sourceRoot?: string
    ) => this.getDevServer(devServerContext, ngEnvOptions, transformers, angularOptions, webpackOptions, sourceRoot);
    const bundlerProvider: BundlerProvider = (bundlerContext: BundlerContext) => this.getBundler(bundlerContext, ngEnvOptions);
    return AngularPreview.from({
      devServerProvider,
      bundlerProvider,
      ngEnvOptions,
      hostDependencies,
      mounterPath: require.resolve('./preview/mounter'),
    });
  }

  /**
   * returns an instance of the default TypeScript extractor.
   * used by default for type inference for both JS and TS.
   */
  schemaExtractor(): EnvHandler<SchemaExtractor> {
    return TypeScriptExtractor.from({
      tsconfig: require.resolve('./config/tsconfig.json')
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
    return TemplateList.from([
      NgModuleTemplate.from({ envName, angularVersion: this.angularVersion }),
      NgStandaloneTemplate.from({ envName, angularVersion: this.angularVersion }),
      NgEnvTemplate.from({ envName, angularVersion: this.angularVersion }),
      NgAppTemplate.from({ envName, angularVersion: this.angularVersion })
    ]);
  }

  /**
   * Defines the Angular workspace starters available with the command `bit new`.
   * @see https://bit.dev/docs/angular-env/workspace-starters
   */
  starters(): EnvHandler<StarterList> {
    return StarterList.from([
      AngularStarter.from({ envName: this.constructor.name, angularVersion: this.angularVersion }),
      DesignSystemStarter.from({ envName: this.constructor.name }),
      MaterialDesignSystemStarter.from({ envName: this.constructor.name })
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

  workspaceConfig(): ConfigWriterList {
    return ConfigWriterList.from([
      TypescriptConfigWriter.from({
        tsconfig: require.resolve('./config/tsconfig.json')
      }),
      EslintConfigWriter.from({
        configPath: require.resolve('./config/eslintrc'),
        tsconfig: require.resolve('./config/tsconfig.json')
      }),
      PrettierConfigWriter.from({
        configPath: require.resolve('./config/prettier.config')
      })
    ]);
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
    return AppTypeList.from([AngularAppType.from({ angularEnv: this, name: NG_APP_NAME })]);
  }
}

import { ApplicationOptions, BrowserOptions, DevServerOptions } from '@bitdev/angular.dev-services.common';
import {
  AngularPreview,
  BundlerProvider,
  DevServerProvider
} from '@bitdev/angular.dev-services.preview.preview';
import { AngularV16Env } from '@bitdev/angular.envs.angular-v16-env';
import {
  NgAppTemplate,
  NgEnvTemplate,
  NgModuleTemplate,
  NgStandaloneTemplate
} from '@bitdev/angular.templates.generators';
import { AngularStarter } from '@bitdev/angular.templates.starters';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { EslintConfigWriter, ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { JestTask, JestTester } from '@teambit/defender.jest-tester';
import { PrettierConfigWriter, PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { EnvHandler } from '@teambit/envs';
import { StarterList, TemplateList } from '@teambit/generator';
import { Linter } from '@teambit/linter';
import { Preview } from '@teambit/preview';
import { SchemaExtractor } from '@teambit/schema';
import { Tester } from '@teambit/tester';
import { TypeScriptExtractor } from '@teambit/typescript';
import { TypescriptConfigWriter } from '@teambit/typescript.typescript-compiler';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { ConfigWriterList } from '@teambit/workspace-config-files';
import { ESLint as ESLintLib } from 'eslint';
import hostDependencies from './preview/host-dependencies';

export class MyAngularV16Env extends AngularV16Env {
  // Name of the environment, used for friendly mentions across bit
  name = 'my-angular-v16-env';

  getTesterConfig() {
    return {
      jest: require.resolve('jest'),
      config: require.resolve('./config/jest.config')
    };
  }

  /**
   * Returns a tester to use during development
   * Required for `bit start` & `bit test`
   */
  override tester(): EnvHandler<Tester> {
    /**
     * @see https://bit.dev/reference/jest/using-jest
     * */
    return JestTester.from(this.getTesterConfig());
  }

  getLinterConfig() {
    return {
      tsconfig: require.resolve('./config/tsconfig.json'),
      eslint: ESLintLib,
      configPath: require.resolve('./config/eslintrc'),
      // resolve all plugins from the angular environment.
      pluginsPath: __dirname,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs']
    };
  }

  /**
   * The linter to use during development.
   * Config files would be used to validate coding standards in components.
   * bit will write the minimum required files in any workspace to optimize
   * for dev experience.
   */
  override linter(): EnvHandler<Linter> {
    return ESLintLinter.from(this.getLinterConfig());
  }

  /**
   * The formatter to use during development
   * (source files are not formatted as part of the components' build)
   * */
  override formatter() {
    /**
     * @see https://bit.dev/reference/prettier/using-prettier
     * */
    return PrettierFormatter.from({
      configPath: require.resolve('./config/prettier.config')
    });
  }

  /**
   * Generates the component previews during development and build
   */
  override preview(): EnvHandler<Preview> {
    const ngEnvOptions = this.getNgEnvOptions();
    const tsconfigPath = require.resolve('./config/tsconfig.json');
    /**
     * To customize the dev server or bundler behavior, you can change webpack transformers, angular
     * options and webpack options in the getDevServer and getBundler methods.
     */
    const devServerProvider: DevServerProvider = (
      devServerContext: DevServerContext,
      transformers: WebpackConfigTransformer[] = [],
      angularOptions: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions> = {},
      webpackOptions: any = {},
      sourceRoot?: string
    ) => this.getDevServer(devServerContext, ngEnvOptions, transformers, {
      ...angularOptions,
      tsConfig: tsconfigPath
    }, webpackOptions, sourceRoot);
    const bundlerProvider: BundlerProvider = (
      bundlerContext: BundlerContext,
      transformers: WebpackConfigTransformer[] = [],
      angularOptions: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions> = {},
      webpackOptions: any = {},
      sourceRoot?: string
    ) => this.getBundler(bundlerContext, ngEnvOptions, transformers, {
      ...angularOptions,
      tsConfig: tsconfigPath
    }, webpackOptions, sourceRoot);
    return AngularPreview.from({
      devServerProvider,
      bundlerProvider,
      ngEnvOptions,
      hostDependencies,
      mounterPath: require.resolve('./preview/mounter')
    });
  }

  /**
   * Defines the build pipeline for a component.
   * Pipelines are optimized for performance and consistency, making sure every component is
   * independently built and tested.
   * This is a set of processes to be performed before a component is snapped, during its build phase
   * @see https://bit.dev/docs/angular-env/build-pipelines
   */
  override build() {
    return super.build().replace([
      EslintTask.from(this.getLinterConfig()),
      JestTask.from(this.getTesterConfig())
    ]);
  }

  /**
   * Defines the component generators (templates) available with the command `bit templates`.
   * @see https://bit.dev/docs/angular-env/component-generators
   */
  override generators(): EnvHandler<TemplateList> {
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
  override starters(): EnvHandler<StarterList> {
    return StarterList.from([
      AngularStarter.from({ envName: this.constructor.name, angularVersion: this.angularVersion })
    ]);
  }

  /**
   * returns an instance of the default TypeScript extractor.
   * used by default for type inference for both JS and TS.
   */
  override schemaExtractor(): EnvHandler<SchemaExtractor> {
    return TypeScriptExtractor.from({
      tsconfig: require.resolve('./config/tsconfig.json')
    });
  }

  override workspaceConfig(): ConfigWriterList {
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
}

export default new MyAngularV16Env();

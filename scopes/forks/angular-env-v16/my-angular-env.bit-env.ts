import { AngularPreview, BundlerProvider, DevServerProvider } from '@teambit/angular-preview';
import { AngularStarter } from '@teambit/angular-starters';
import { NgAppTemplate, NgEnvTemplate, NgModuleTemplate } from '@teambit/angular-templates';
import { AngularV16Env } from '@teambit/angular-v16';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { JestTask, JestTester } from '@teambit/defender.jest-tester';
import { PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { EnvHandler } from '@teambit/envs';
import { StarterList, TemplateList } from '@teambit/generator';
import { Linter } from '@teambit/linter';
import { Preview } from '@teambit/preview';
import { Tester } from '@teambit/tester';
import { ESLint as ESLintLib } from 'eslint';
import hostDependencies from './preview/host-dependencies';

export class MyAngularEnv extends AngularV16Env {
  // Name of the environment, used for friendly mentions across bit
  name = 'my-angular-env';

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
      tsconfig: require.resolve('@teambit/angular-eslint-config/config/tsconfig.json'),
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
    /**
     * To customize the dev server or bundler behavior, you can change webpack transformers, angular
     * options and webpack options in the getDevServer and getBundler methods.
     */
    const devServerProvider: DevServerProvider = (devServerContext: DevServerContext) => this.getDevServer(devServerContext, ngEnvOptions);
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
   * Defines the build pipeline for a component.
   * Pipelines are optimized for performance and consistency, making sure every component is
   * independently built and tested.
   * This is a set of processes to be performed before a component is snapped, during its build phase
   * @see https://bit.dev/docs/angular-env/build-pipelines
   */
  override build() {
    return super.build().replace([
      EslintTask.from(this.getLinterConfig()),
      JestTask.from(this.getTesterConfig()),
    ]);
  }

  /**
   * Defines the component generators (templates) available with the command `bit templates`.
   * @see https://bit.dev/docs/angular-env/component-generators
   */
  override generators(): EnvHandler<TemplateList> {
    const envName = this.constructor.name;
    return TemplateList.from([
      NgModuleTemplate.from({envName, angularVersion: this.angularVersion}),
      NgEnvTemplate.from({envName, angularVersion: this.angularVersion}),
      NgAppTemplate.from({envName, angularVersion: this.angularVersion})
    ]);
  }

  /**
   * Defines the Angular workspace starters available with the command `bit new`.
   * @see https://bit.dev/docs/angular-env/workspace-starters
   */
  override starters(): EnvHandler<StarterList> {
    return StarterList.from([
      AngularStarter.from({envName: this.constructor.name, angularVersion: this.angularVersion})
    ]);
  }
}

export default new MyAngularEnv();

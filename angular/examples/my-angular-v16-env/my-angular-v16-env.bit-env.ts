import {
  NgMultiCompiler,
  NgMultiCompilerTask
} from '@bitdev/angular.dev-services.compiler.multi-compiler';
import { AngularPreview } from '@bitdev/angular.dev-services.preview.preview';
import { AngularV16Env } from '@bitdev/angular.envs.angular-v16-env';
import { Pipeline } from '@teambit/builder';
import { Compiler } from '@teambit/compiler';
import { EslintConfigWriter, ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { JestTask, JestTester } from '@teambit/defender.jest-tester';
import { PrettierConfigWriter, PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { EnvHandler } from '@teambit/envs';
import { Linter } from '@teambit/linter';
import { Preview } from '@teambit/preview';
import { Tester } from '@teambit/tester';
import { TypescriptConfigWriter } from '@teambit/typescript.typescript-compiler';
import { ConfigWriterList } from '@teambit/workspace-config-files';
import { ESLint as ESLintLib } from 'eslint';
import { createRequire } from 'node:module';
import hostDependencies from './preview/host-dependencies.js';

let ngMultiCompiler: EnvHandler<NgMultiCompiler> | undefined;

const require = createRequire(import.meta.url);

export class MyAngularV16Env extends AngularV16Env {
  // Name of the environment, used for friendly mentions across bit
  name = 'my-angular-v16-env';

  getTesterConfig() {
    return {
      jest: require.resolve('jest'),
      config: require.resolve('./config/jest.config.cjs')
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
      configPath: require.resolve('./config/eslintrc.cjs'),
      // resolve all plugins from the angular environment.
      pluginsPath: import.meta.dirname,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs']
    };
  }

  /**
   * Returns an instance of the compiler
   * Required for making and reading dists, especially for `bit compile`
   */
  compiler(): EnvHandler<Compiler> {
    if (!ngMultiCompiler) {
      ngMultiCompiler = NgMultiCompiler.from({
        ngEnvOptions: this.getNgEnvOptions(),
        tsconfigPath: require.resolve('./config/tsconfig.json'),
      });
    }
    return ngMultiCompiler!;
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
      configPath: require.resolve('./config/prettier.config.cjs')
    });
  }

  /**
   * Generates the component previews during development and build
   */
  override preview(): EnvHandler<Preview> {
    const tsConfig = require.resolve('./config/tsconfig.json');
    return AngularPreview.from({
      ngEnvOptions: this.getNgEnvOptions(),
      hostDependencies,
      mounterPath: require.resolve('./preview/mounter.js'),
      angularServeOptions: { tsConfig },
      angularBuildOptions: { tsConfig },
    });
  }

  /**
   * Defines the build pipeline for a component.
   * Pipelines are optimized for performance and consistency, making sure every component is
   * independently built and tested.
   * This is a set of processes to be performed before a component is snapped, during its build phase
   * @see https://bit.dev/docs/angular-env/build-pipelines
   */
  override build(): Pipeline {
    return Pipeline.from([
      NgMultiCompilerTask.from({ ngMultiCompiler: this.compiler() }),
      EslintTask.from(this.getLinterConfig()),
      JestTask.from(this.getTesterConfig())
    ]);
  }

  override workspaceConfig(): ConfigWriterList {
    return ConfigWriterList.from([
      TypescriptConfigWriter.from({
        tsconfig: require.resolve('./config/tsconfig.json')
      }),
      EslintConfigWriter.from({
        configPath: require.resolve('./config/eslintrc.cjs'),
        tsconfig: require.resolve('./config/tsconfig.json')
      }),
      PrettierConfigWriter.from({
        configPath: require.resolve('./config/prettier.config.cjs')
      })
    ]);
  }
}

export default new MyAngularV16Env();

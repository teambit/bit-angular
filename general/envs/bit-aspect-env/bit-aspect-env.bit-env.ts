import { CAPSULE_ARTIFACTS_DIR, Pipeline } from '@teambit/builder';
import { Compiler } from '@teambit/compiler';
import { EslintConfigWriter, ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { PrettierConfigWriter, PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { EnvHandler } from '@teambit/envs';
import { StarterList, TemplateList } from '@teambit/generator';
import { PackageGenerator } from '@teambit/pkg';
import { Preview } from '@teambit/preview';
import { ReactPreview } from '@teambit/preview.react-preview';
import { SchemaExtractor } from '@teambit/schema';
import { Tester } from '@teambit/tester';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { TypeScriptExtractor } from '@teambit/typescript';
import {
  resolveTypes,
  TypescriptCompiler,
  TypescriptConfigWriter,
  TypescriptTask
} from '@teambit/typescript.typescript-compiler';
import { VitestTask, VitestTester } from '@teambit/vite.vitest-tester';
import { ConfigWriterList } from '@teambit/workspace-config-files';
import typescript from 'typescript';
import { BitAspectEnvInterface } from './bit-aspect-env.interface';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class BitAspectEnv implements BitAspectEnvInterface {
  name = "aspect";

  icon = 'https://static.bit.dev/extensions-icons/default.svg';

  protected tsconfigPath = require.resolve('./config/tsconfig.json');

  protected tsTypesPath = './types';

  protected eslintConfigPath = require.resolve('./config/eslintrc.js');

  protected eslintExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cts', '.mts', '.ctsx', '.mtsx'];

  protected prettierConfigPath = require.resolve('./config/prettier.config.js');

  /**
   * Default npm ignore paths.
   * Will ignore the "artifacts" directory by default.
   */
  npmIgnore = [`${CAPSULE_ARTIFACTS_DIR}/`, '.vitest'];

  /**
   * Default package.json modifications.
   */
  packageJson = {
    type: 'module',
    main: 'dist/{main}.js',
    types: '{main}.ts',
  };

  /*
   * The compiler to use during development
   */
  compiler(): EnvHandler<Compiler> {
    return TypescriptCompiler.from({
      tsconfig: this.tsconfigPath,
      esm: true,
      types: resolveTypes(__dirname, [this.tsTypesPath]),
      typescript,
    });
  }

  /*
   * The test runner to use during development
   */
  tester(): EnvHandler<Tester> {
    return VitestTester.from({
      config: require.resolve('./config/vitest.config.mjs')
    });
  }

  /*
   * The linter to use during development
   */
  linter() {
    return ESLintLinter.from({
      tsconfig: this.tsconfigPath,
      configPath: this.eslintConfigPath,
      pluginsPath: __dirname,
      extensions: this.eslintExtensions,
    });
  }

  preview(): EnvHandler<Preview> {
    return ReactPreview.from({
      // configure the env not to create a preview for the impl. just for the composition.
      previewConfig: {
        splitComponentBundle: false
      },
      // docsTemplate: require.resolve('./preview/docs'),
      // mounter: require.resolve('./preview/mounter'),
      // transformers: [webpackTransformer],
    });
  }

  /**
   * The formatter to use during development (source files are not formatted as part of the components' build).
   */
  formatter() {
    return PrettierFormatter.from({
      configPath: this.prettierConfigPath,
    });
  }

  /**
   * A set of processes to be performed before a component is snapped, during its build phase.
   * @see https://bit.dev/docs/node-env/build-pipelines
   */
  build() {
    return Pipeline.from([
      TypescriptTask.from({
        tsconfig: this.tsconfigPath,
        types: resolveTypes(__dirname, [this.tsTypesPath]),
        typescript,
      }),
      EslintTask.from({
        tsconfig: this.tsconfigPath,
        configPath: this.eslintConfigPath,
        pluginsPath: __dirname,
        extensions: this.eslintExtensions,
      }),
      // JestTask.from({ config: require.resolve('./config/jest.config') }),
      VitestTask.from({
        config: require.resolve('./config/vitest.config.mjs'),
      }),
    ]);
  }

  /**
   * A list of starters for new projects.
   * This helps create a quick and standardized workspace setup.
   */
  starters() {
    return StarterList.from([]);
  }

  /**
   * Sets a list of component templates to use across your workspaces.
   * New workspaces would be set to include your envs by default.
   */
  generators() {
    return TemplateList.from([]);
  }

  /**
   * Configure and control the packaging process of components.
   */
  package() {
    return PackageGenerator.from({
      packageJson: this.packageJson,
      npmIgnore: this.npmIgnore,
    });
  }

  /**
   * Returns an instance of the default TypeScript extractor.
   * Used by default for type inference for both JS and TS.
   */
  schemaExtractor(): EnvHandler<SchemaExtractor> {
    return TypeScriptExtractor.from({
      tsconfig: this.tsconfigPath,
    });
  }

  /**
   * Add build tasks to execute upon [snap](https://bit.dev/docs/snaps).
   * Use the snap pipeline for staging and test deployments
   */
  snap() {
    return Pipeline.from([]);
  }

  /**
   * Add build tasks to execute upon [tag](https://bit.dev/docs/tags).
   * use the tag pipeline for deployments, or other tasks required for
   * publishing a semantic version for a component.
   */
  tag() {
    return Pipeline.from([]);
  }

  workspaceConfig(): ConfigWriterList {
    return ConfigWriterList.from([
      TypescriptConfigWriter.from({
        tsconfig: this.tsconfigPath,
        types: resolveTypes(__dirname, ["./types"]),
      }),
      EslintConfigWriter.from({
        configPath: this.eslintConfigPath,
        tsconfig: this.tsconfigPath,
      }),
      PrettierConfigWriter.from({
        configPath: this.prettierConfigPath,
      })
    ]);
  }
}

export default new BitAspectEnv();

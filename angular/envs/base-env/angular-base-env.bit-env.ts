import { AngularEnvOptions, NG_ELEMENTS_PATTERN } from '@bitdev/angular.dev-services.common';
import { NgMultiCompiler, NgMultiCompilerTask } from '@bitdev/angular.dev-services.compiler.multi-compiler';
import { AngularVitePreview } from "@bitdev/angular.dev-services.preview.vite-preview";
import {
  NgAppTemplate, NgElementsTemplate,
  NgEnvTemplate,
  NgModuleTemplate,
  NgStandaloneTemplate
} from '@bitdev/angular.templates.generators';
import { AngularStarter, DesignSystemStarter, MaterialDesignSystemStarter } from '@bitdev/angular.templates.starters';
import { CAPSULE_ARTIFACTS_DIR, Pipeline } from '@teambit/builder';
import { Compiler } from '@teambit/compiler';
import { Component } from '@teambit/component';
import { EslintConfigWriter, ESLintLinter, EslintTask } from '@teambit/defender.eslint-linter';
import { JestTask, JestTester } from '@teambit/defender.jest-tester';
import { PrettierConfigWriter, PrettierFormatter } from '@teambit/defender.prettier-formatter';
import { EnvHandler } from '@teambit/envs';
import { Formatter } from '@teambit/formatter';
import { StarterList, TemplateList } from '@teambit/generator';
import { Linter } from '@teambit/linter';
import { PackageGenerator } from '@teambit/pkg';
import { Preview } from '@teambit/preview';
import { SchemaExtractor } from '@teambit/schema';
import { Tester } from '@teambit/tester';
import { TypeScriptExtractor } from '@teambit/typescript';
import { TypescriptConfigWriter } from '@teambit/typescript.typescript-compiler';
import { ConfigWriterList } from '@teambit/workspace-config-files';
import { ESLint as ESLintLib } from 'eslint';
import { merge } from 'lodash-es';
// @ts-ignore
import minimatch from "minimatch";
import { createRequire } from 'node:module';
import { AngularEnvInterface } from './angular-env.interface.js';

const req = createRequire(import.meta.url);

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularBaseEnv implements AngularEnvInterface {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';

  distDir = 'dist';

  ngMultiCompiler: EnvHandler<NgMultiCompiler> | undefined;

  /** Abstract functions & properties specific to the adapter * */
  abstract ngEnvOptions: AngularEnvOptions;

  abstract name: string;

  abstract readonly angularVersion: number;

  [key: string]: any;

  /*** Default functions & properties that custom envs will override ***/
  /* Typescript config used for linter, schema extractor and config writer */
  protected tsconfigPath = req.resolve('./config/tsconfig.json');

  /* ESLint config. Learn how to replace linter - https://bit.dev/reference/linting/set-up-linter */
  protected eslintConfigPath = req.resolve('./config/eslintrc.cjs');

  /* Prettier config. Learn how to replace formatter - https://bit.dev/reference/formatting/set-up-formatter */
  protected prettierConfigPath = req.resolve('./config/prettier.config.cjs');

  /* Component mounting and dev-server config. Learn how to replace dev-server - https://bit.dev/reference/preview/setup-preview */
  protected previewMounterPath = req.resolve('./config/mounter.js');

  /* Jest config. Learn how to replace tester - https://bit.dev/reference/testing/set-up-tester */
  protected abstract jestConfigPath: string;

  /*** End of default functions & properties ***/

  public getNgEnvOptions(): AngularEnvOptions {
    return { ...this.ngEnvOptions };
  }

  /**
   * Deeply merge the given options with the existing/default options
   */
  public setNgEnvOptions(...ngEnvOptions: Partial<AngularEnvOptions>[]): void {
    this.ngEnvOptions = merge(this.ngEnvOptions || {}, ...ngEnvOptions);
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
        tsconfigPath: this.tsconfigPath,
        ngEnvOptions: this.getNgEnvOptions(),
        bitCompilerOptions: {
          distDir: this.distDir,
        }
      });
    }
    return this.ngMultiCompiler;
  }

  formatter(): EnvHandler<Formatter> {
    return PrettierFormatter.from({
      configPath: this.prettierConfigPath
    });
  }

  getLinterConfig(): any {
    return {
      tsconfig: this.tsconfigPath,
      eslint: ESLintLib,
      configPath: this.eslintConfigPath,
      // resolve all plugins from the angular environment.
      pluginsPath: import.meta.dirname,
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
   * Default npm ignore paths.
   * Will ignore the "artifacts" directory by default.
   */
  npmIgnore = [`${CAPSULE_ARTIFACTS_DIR}/`, '.vitest'];

  /**
   * Default package.json modifications.
   */
  packageJson = {
    type: 'module',
    main: `${this.distDir}/browser/main.js`,
    types: '{main}.ts',
  };

  /**
   * Configure and control the packaging process of components.
   */
  package() {
    return PackageGenerator.from({
      packageJson: this.packageJson,
      npmIgnore: this.npmIgnore,
      // @ts-ignore missing property from type ?
      modifyPackageJson: async (cmp: Component, packageJsonObject: PackageJsonProps): Promise<PackageJsonProps> => {
        if (minimatch(cmp.config.main, NG_ELEMENTS_PATTERN)) {
          const main = "./dist/browser/main.js";
          const ngPackage = {
            "exports": {
              "./package.json": {
                "default": "./package.json"
              },
              ".": {
                "default": main
              },
            },
          };
          packageJsonObject = Object.assign(packageJsonObject, ngPackage);
        }
        return packageJsonObject;
      }
    });
  }

  preview(): EnvHandler<Preview> {
    return AngularVitePreview.from({
      mounterPath: this.previewMounterPath
    });
  }

  /**
   * returns an instance of the default TypeScript extractor.
   * used by default for type inference for both JS and TS.
   */
  schemaExtractor(): EnvHandler<SchemaExtractor> {
    return TypeScriptExtractor.from({
      tsconfig: this.tsconfigPath
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
      NgElementsTemplate.from({ envName, angularVersion: this.angularVersion }),
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
        tsconfig: this.tsconfigPath
      }),
      EslintConfigWriter.from({
        configPath: this.eslintConfigPath,
        tsconfig: this.tsconfigPath
      }),
      PrettierConfigWriter.from({
        configPath: this.prettierConfigPath
      })
    ]);
  }

  getTesterConfig() {
    return {
      jest: this.jestModulePath,
      config: this.jestConfigPath
    };
    // return VitestTester.from({
    //   config: require.resolve(ngEnvOptions.vitestConfigPath)
    // });
  }

  /**
   * Returns a tester
   * Required for `bit start` & `bit test`
   */
  tester(): EnvHandler<Tester> {
    return JestTester.from(this.getTesterConfig());
  }
}

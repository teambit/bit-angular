import { eslintConfig } from '@teambit/angular-eslint-config';
import { BuildTask } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerMain, CompilerOptions } from '@teambit/compiler';
import { VariantPolicyConfigObject } from '@teambit/dependency-resolver';
import {
  BuilderEnv,
  CompilerEnv,
  DependenciesEnv,
  DevEnv,
  EnvDescriptor,
  LinterEnv,
  TesterEnv
} from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { JestMain } from '@teambit/jest';
import { Linter } from '@teambit/linter';
import { NgPackagr, NgPackagrMain } from '@teambit/ng-packagr';
import { Tester } from '@teambit/tester';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { CompilerOptions as TsCompilerOptions } from '@angular/compiler-cli';
import { angularTemplates } from './angular.templates';
import { AngularWebpack } from './angular.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularEnv implements CompilerEnv, LinterEnv, DependenciesEnv, DevEnv, TesterEnv {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';

  constructor(
    protected jestAspect: JestMain,
    protected compiler: CompilerMain,
    protected eslint: ESLintMain,
    protected ngPackagrAspect: NgPackagrMain,
    generator: GeneratorMain
  ) {
    generator.registerComponentTemplate(angularTemplates);
  }

  /** Abstract functions & properties specific to the adapter **/
  abstract name: string;
  abstract ngPackagr: NgPackagr;
  abstract readDefaultTsConfig: (filename?: string) => any;
  abstract angularWebpack: AngularWebpack;
  abstract __getDescriptor(): Promise<EnvDescriptor>;
  abstract getDependencies(): VariantPolicyConfigObject | Promise<VariantPolicyConfigObject>;

  private createNgPackgrCompiler(tsCompilerOptions?: TsCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>) {
    return this.ngPackagrAspect.createCompiler(this.ngPackagr, this.readDefaultTsConfig, tsCompilerOptions, bitCompilerOptions);
  }

  getCompiler(tsCompilerOptions?: TsCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>) {
    return this.createNgPackgrCompiler(tsCompilerOptions, bitCompilerOptions);
  }

  /**
   * Returns the component build pipeline
   * Required for `bit build`
   */
  getBuildPipe(tsCompilerOptions?: TsCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): BuildTask[] {
    const compiler = this.getCompiler(tsCompilerOptions, bitCompilerOptions);
    const compilerTask = this.compiler.createTask('NgPackagrCompiler', compiler);
    return [compilerTask];
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
    return this.angularWebpack.createBundler(context, transformers);
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
  getTester(jestConfigPath: string, jestModulePath: string): Tester {
    const config = jestConfigPath || require.resolve('./jest/jest.config');
    return this.jestAspect.createTester(config, jestModulePath || require.resolve('jest'));
  }

  /**
   * Returns and configures the dev server.
   * Required for `bit start`
   */
  async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    return this.angularWebpack.createDevServer(context, transformers);
  }
}

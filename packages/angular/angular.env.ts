import { CompilerOptions as TsCompilerOptions } from '@angular/compiler-cli';
import { eslintConfig } from '@teambit/angular-eslint-config';
import { BuildTask } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerMain, CompilerOptions } from '@teambit/compiler';
import { VariantPolicyConfigObject } from '@teambit/dependency-resolver';
import {
  CompilerEnv,
  DependenciesEnv,
  DevEnv,
  EnvDescriptor,
  LinterEnv,
  TesterEnv
} from '@teambit/envs';
import { EslintConfigTransformer, ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { Linter, LinterContext } from '@teambit/linter';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { Tester } from '@teambit/tester';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { angularTemplates, workspaceTemplates } from './angular.templates';
import { AngularWebpack } from './angular.webpack';
import { getNodeModulesPaths } from './webpack-plugins/utils';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularEnv implements LinterEnv, DependenciesEnv, DevEnv, TesterEnv, CompilerEnv {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';
  nodeModulesPaths: string[] = [];

  constructor(
    protected jestAspect: JestMain,
    protected compiler: CompilerMain,
    protected eslint: ESLintMain,
    protected ngPackagrAspect: NgPackagrMain,
    isolator: IsolatorMain,
    workspace: Workspace | undefined,
    generator: GeneratorMain,
  ) {
    generator.registerComponentTemplate(angularTemplates);
    generator.registerWorkspaceTemplate(workspaceTemplates);
    if (workspace) {
      const scopeAspectsRootDir = isolator.getCapsulesRootDir(workspace.scope.getAspectCapsulePath());
      this.nodeModulesPaths = getNodeModulesPaths(workspace.path, scopeAspectsRootDir);
    }
  }

  /** Abstract functions & properties specific to the adapter **/
  abstract name: string;
  abstract ngPackagr: string;
  abstract readDefaultTsConfig: string;
  abstract angularWebpack: AngularWebpack;
  abstract __getDescriptor(): Promise<EnvDescriptor>;
  abstract getDependencies(): VariantPolicyConfigObject | Promise<VariantPolicyConfigObject>;
  abstract jestConfigPath: string;
  abstract jestModulePath: string;

  private createNgPackgrCompiler(tsCompilerOptions?: TsCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>) {
    return this.ngPackagrAspect.createCompiler(this.ngPackagr, this.readDefaultTsConfig, tsCompilerOptions, bitCompilerOptions, this.nodeModulesPaths);
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
  getLinter(context: LinterContext, transformers: EslintConfigTransformer[] = []): Linter {
    return this.eslint.createLinter(context, {
      config: eslintConfig as any,
      // resolve all plugins from the angular environment.
      pluginPath: __dirname,
    }, transformers);
  }

  /**
   * Returns a tester
   * Required for `bit start` & `bit test`
   */
  getTester(jestConfigPath: string, jestModulePath: string): Tester {
    const config = jestConfigPath || this.jestConfigPath;
    return this.jestAspect.createTester(config, jestModulePath || this.jestModulePath);
  }

  /**
   * Returns and configures the dev server.
   * Required for `bit start`
   */
  async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    return this.angularWebpack.createDevServer(context, transformers);
  }
}

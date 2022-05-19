import type { AngularCompilerOptions } from '@angular/compiler-cli';
import {
  AngularAppType,
  BrowserOptions,
  DevServerOptions,
  NG_APP_NAME
} from '@teambit/angular-apps';
import { eslintConfig } from '@teambit/angular-eslint-config';
import { AppBuildContext, AppContext, ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { BuildTask } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Compiler, CompilerMain, CompilerOptions } from '@teambit/compiler';
import {
  DependencyInstaller,
  DependencyResolverMain,
  InstallArgs,
  VariantPolicyConfigObject
} from '@teambit/dependency-resolver';
import {
  CompilerEnv,
  DependenciesEnv,
  DevEnv,
  EnvDescriptor,
  LinterEnv,
  PreviewEnv,
  TesterEnv
} from '@teambit/envs';
import { EslintConfigTransformer, ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { Linter, LinterContext } from '@teambit/linter';
import { NgMultiCompilerMain } from '@teambit/ng-multi-compiler';
import { NgccProcessor } from '@teambit/ngcc';
import { EnvPreviewConfig } from '@teambit/preview';
import { Tester, TesterMain } from '@teambit/tester';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularEnvOptions } from './angular-base.main.runtime';
import { angularBaseTemplates, workspaceTemplates } from './angular-base.templates';
import { AngularBaseWebpack } from './angular-base.webpack';
import { getNodeModulesPaths } from './webpack-plugins/utils';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularBaseEnv implements LinterEnv, DependenciesEnv, DevEnv, TesterEnv, CompilerEnv, PreviewEnv {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';
  useAngularElements = false;
  private ngMultiCompiler: Compiler | undefined;

  /** Abstract functions & properties specific to the adapter **/
  abstract name: string;
  abstract ngPackagr: string;
  abstract elements: string | null;
  abstract readDefaultTsConfig: string;
  abstract angularWebpack: AngularBaseWebpack;
  abstract __getDescriptor(): Promise<EnvDescriptor>;
  abstract getDependencies(): VariantPolicyConfigObject | Promise<VariantPolicyConfigObject>;
  abstract jestConfigPath: string;
  abstract jestModulePath: string;

  constructor(
    protected jestAspect: JestMain,
    protected compiler: CompilerMain,
    private tester: TesterMain,
    protected eslint: ESLintMain,
    protected ngMultiCompilerMain: NgMultiCompilerMain,
    private isolator: IsolatorMain,
    protected workspace: Workspace | undefined,
    generator: GeneratorMain,
    application: ApplicationMain,
    private aspectLoader: AspectLoaderMain,
    dependencyResolver: DependencyResolverMain,
    protected options: AngularEnvOptions
  ) {
    generator.registerComponentTemplate(angularBaseTemplates);
    generator.registerWorkspaceTemplate(workspaceTemplates);
    application.registerAppType(new AngularAppType(NG_APP_NAME, this));
    dependencyResolver.registerPostInstallSubscribers([this.postInstall.bind(this)]);
    console.trace(options, options.useAngularElements);
    this.useAngularElements = !!options.useAngularElements;
  }

  isAppContext(context: DevServerContext | AppContext): context is DevServerContext & AppContext {
    return (context as any).appName !== undefined;
  }

  isAppBuildContext(context: BundlerContext | AppBuildContext): context is BundlerContext & AppBuildContext {
    return (context as any).appName !== undefined;
  }

  private getNodeModulesPaths(build: boolean): string[] {
    if (!this.workspace) {
      return [];
    }
    const scopeAspectsRootDir = this.isolator.getCapsulesRootDir(this.workspace.scope.getAspectCapsulePath());
    const workspaceCapsulesRootDir = build ? this.isolator.getCapsulesRootDir(this.workspace.path) : undefined;
    return getNodeModulesPaths(this.workspace.path, scopeAspectsRootDir, workspaceCapsulesRootDir);
  }

  private async postInstall(installer: DependencyInstaller, installArgs: InstallArgs): Promise<void> {
    const isBuild = installArgs.rootDir !== this.workspace?.path;
    // Process all node_modules folders (only works if the modules are hoisted)
    this.getNodeModulesPaths(isBuild).forEach(path => new NgccProcessor().process(path));
  }

  private createNgMultiCompiler(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): Compiler {
    const nodeModulesPaths = this.getNodeModulesPaths(false);
    return this.ngMultiCompilerMain.createCompiler(this.ngPackagr, this.useAngularElements, this.readDefaultTsConfig, tsCompilerOptions, bitCompilerOptions, nodeModulesPaths);
  }

  /**
   * Returns a compiler
   * Required for making and reading dists, especially for `bit compile`
   */
  getCompiler(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): Compiler {
    if(!this.ngMultiCompiler) {
      this.ngMultiCompiler = this.createNgMultiCompiler(tsCompilerOptions, bitCompilerOptions);
    }
    return this.ngMultiCompiler;
  }

  /**
   * Returns the component build pipeline
   * Required for `bit build`
   */
  getBuildPipe(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): BuildTask[] {
    const compiler = this.getCompiler(tsCompilerOptions, bitCompilerOptions);
    const compilerTask = this.compiler.createTask('NgPackagrCompiler', compiler);
    return [compilerTask, this.tester.task];
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
   * Required for `bit build`
   */
  async getBundler(context: BundlerContext | (BundlerContext & AppBuildContext), transformers: any[] = [], angularBuildOptions: Partial<BrowserOptions> = {}, sourceRoot?: string): Promise<Bundler> {
    const nodeModulesPaths = this.getNodeModulesPaths(true);
    return this.angularWebpack.createBundler(context, transformers, nodeModulesPaths, angularBuildOptions, sourceRoot);
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
  async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = [], angularServeOptions: Partial<BrowserOptions & DevServerOptions> = {}, sourceRoot?: string): Promise<DevServer> {
    const nodeModulesPaths = this.getNodeModulesPaths(false);
    return this.angularWebpack.createDevServer(context, transformers, nodeModulesPaths, angularServeOptions, sourceRoot);
  }

  /**
   * Required to use the old preview code until the envs are updated to use the new version
   */
  getPreviewConfig(): EnvPreviewConfig {
    return {
      strategyName: 'env',
      splitComponentBundle: false
    }
  }
}

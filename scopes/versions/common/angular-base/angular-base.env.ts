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
import { BabelMain } from '@teambit/babel';
import { BuildTask } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Compiler, CompilerMain, CompilerOptions } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
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
import { Logger, LoggerMain } from '@teambit/logger';
import { NgMultiCompiler } from '@teambit/ng-multi-compiler';
import { NgccProcessor } from '@teambit/ngcc';
import { EnvPreviewConfig } from '@teambit/preview';
import { Tester, TesterMain } from '@teambit/tester';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { angularBaseTemplates, workspaceTemplates } from './angular-base.templates';
import { AngularBaseWebpack } from './angular-base.webpack';
import { getNodeModulesPaths } from './webpack-plugins/utils';

export interface AngularEnvOptions {
  /**
   * Use Rollup & Angular Elements to compile compositions instead of webpack.
   * This transforms compositions into Web Components and replaces the Angular bundler by the React bundler.
   */
  useAngularElementsPreview?: boolean;

  /**
   * Override the default Angular docs template path
   */
  docsTemplatePath?: string;

  /**
   * Override the default Angular mount template path
   */
  mountTemplatePath?: string;
}
interface DefaultAngularEnvOptions {
  useAngularElementsPreview: boolean;
  docsTemplatePath: string;
  mountTemplatePath: string;
}

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularBaseEnv implements LinterEnv, DependenciesEnv, DevEnv, TesterEnv, CompilerEnv, PreviewEnv {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';
  private logger: Logger;
  private ngMultiCompiler: Compiler | undefined;
  private ngEnvOptions: DefaultAngularEnvOptions = {
    useAngularElementsPreview: false,
    docsTemplatePath: require.resolve('./preview/src/docs'),
    mountTemplatePath: require.resolve('./preview/src/mount'),
  };
  readonly applicationType = 'angular';

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
  abstract getDevEnvId(id?: string): string;

  constructor(
    protected jestAspect: JestMain,
    protected compiler: CompilerMain,
    private tester: TesterMain,
    protected eslint: ESLintMain,
    private isolator: IsolatorMain,
    protected workspace: Workspace | undefined,
    generator: GeneratorMain,
    private application: ApplicationMain,
    private aspectLoader: AspectLoaderMain,
    private depResolver: DependencyResolverMain,
    private loggerMain: LoggerMain,
    private compositions: CompositionsMain,
    private babelMain: BabelMain,
    protected options: AngularEnvOptions,
  ) {
    generator.registerComponentTemplate(angularBaseTemplates);
    generator.registerWorkspaceTemplate(workspaceTemplates);
    this.application.registerAppType(new AngularAppType(NG_APP_NAME, this));
    depResolver.registerPostInstallSubscribers([this.postInstall.bind(this)]);
    this.logger = loggerMain.createLogger(this.getDevEnvId());
    if (options.useAngularElementsPreview) {
      this.ngEnvOptions.useAngularElementsPreview = true;
    }
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

  protected useNgElementsPreview(ngEnvOptions?: AngularEnvOptions): boolean {
    return !!ngEnvOptions?.useAngularElementsPreview ?? this.ngEnvOptions.useAngularElementsPreview;
  }

  private createNgMultiCompiler(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>, ngEnvOptions?: AngularEnvOptions): Compiler {
    const nodeModulesPaths = this.getNodeModulesPaths(false);
    return new NgMultiCompiler(this.ngPackagr, this.useNgElementsPreview(ngEnvOptions), this.babelMain, this.readDefaultTsConfig, this.logger, this.workspace, this.compositions, this.application, this.depResolver, tsCompilerOptions, bitCompilerOptions, nodeModulesPaths);
  }

  /**
   * Returns a compiler
   * Required for making and reading dists, especially for `bit compile`
   */
  getCompiler(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>, ngEnvOptions?: AngularEnvOptions): Compiler {
    if(!this.ngMultiCompiler) {
      this.ngMultiCompiler = this.createNgMultiCompiler(tsCompilerOptions, bitCompilerOptions, ngEnvOptions);
    }
    return this.ngMultiCompiler;
  }

  /**
   * Returns the component build pipeline
   * Required for `bit build`
   */
  getBuildPipe(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>, ngEnvOptions?: AngularEnvOptions): BuildTask[] {
    const compiler = this.getCompiler(tsCompilerOptions, bitCompilerOptions, ngEnvOptions);
    const compilerTask = this.compiler.createTask('NgPackagrCompiler', compiler);
    return [compilerTask, this.tester.task];
  }

  /**
   * Returns a paths to a function which mounts a given component to DOM
   * Required for `bit build`
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMounter(ngEnvOptions?: AngularEnvOptions) {
    return ngEnvOptions?.mountTemplatePath ?? this.ngEnvOptions.mountTemplatePath;
  }

  /**
   * Returns a path to a docs template.
   * Required for `bit build`
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDocsTemplate(ngEnvOptions?: AngularEnvOptions) {
    return ngEnvOptions?.docsTemplatePath ?? this.ngEnvOptions.docsTemplatePath;
  }

  /**
   * Returns a bundler for the preview.
   * Required for `bit build`
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBundler(context: BundlerContext | (BundlerContext & AppBuildContext), transformers: any[] = [], angularBuildOptions: Partial<BrowserOptions> = {}, sourceRoot?: string, ngEnvOptions?: AngularEnvOptions): Promise<Bundler> {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = [], angularServeOptions: Partial<BrowserOptions & DevServerOptions> = {}, sourceRoot?: string, ngEnvOptions?: AngularEnvOptions): Promise<DevServer> {
    const nodeModulesPaths = this.getNodeModulesPaths(false);
    return this.angularWebpack.createDevServer(context, transformers, nodeModulesPaths, angularServeOptions, sourceRoot);
  }

  /**
   * Used to configure peer dependencies from host env
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAdditionalHostDependencies(ngEnvOptions?: AngularEnvOptions): string[] {
    return ['@teambit/mdx.ui.mdx-scope-context', '@mdx-js/react', 'react'];
  }

  /**
   * Required to use the old preview code until the envs are updated to use the new version
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPreviewConfig(ngEnvOptions?: AngularEnvOptions): EnvPreviewConfig {
    return {
      strategyName: 'env',
      splitComponentBundle: false
    }
  }
}

import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { eslintConfig } from '@teambit/angular-eslint-config';
import { AppBuildContext, ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { BabelMain } from '@teambit/babel';
import { BuildTask } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerMain, CompilerOptions } from '@teambit/compiler';
import { DependencyResolverMain, VariantPolicyConfigObject, InstallArgs, DependencyInstaller } from '@teambit/dependency-resolver';
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
import { MultiCompilerMain } from '@teambit/multi-compiler';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { Tester, TesterMain } from '@teambit/tester';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { angularTemplates, workspaceTemplates } from './angular.templates';
import { AngularWebpack } from './angular.webpack';
import { AngularAppType } from './apps/angular.app-type';
import { NgccProcessor } from './webpack-plugins/ngcc-processor';
import { getNodeModulesPaths } from './webpack-plugins/utils';

const presets = [
  require.resolve('@babel/preset-env'),
  require.resolve('@babel/preset-typescript'),
];
const plugins = [require.resolve('@babel/plugin-proposal-class-properties')];

const NG_APP_NAME = 'ng-app';
export const NG_APP_PATTERN = `*.${NG_APP_NAME}.*`;

/**
 * a component environment built for [Angular](https://angular.io).
 */
export abstract class AngularEnv implements LinterEnv, DependenciesEnv, DevEnv, TesterEnv, CompilerEnv {
  icon = 'https://static.bit.dev/extensions-icons/angular.svg';

  constructor(
    protected jestAspect: JestMain,
    protected compiler: CompilerMain,
    private tester: TesterMain,
    protected eslint: ESLintMain,
    protected ngPackagrAspect: NgPackagrMain,
    private isolator: IsolatorMain,
    protected workspace: Workspace | undefined,
    generator: GeneratorMain,
    application: ApplicationMain,
    private aspectLoader: AspectLoaderMain,
    private multicompiler: MultiCompilerMain,
    private babel: BabelMain,
    dependencyResolver: DependencyResolverMain,
  ) {
    generator.registerComponentTemplate(angularTemplates);
    generator.registerWorkspaceTemplate(workspaceTemplates);
    application.registerAppType(new AngularAppType(NG_APP_NAME, this));
    dependencyResolver.registerPostInstallSubscribers([this.postInstall.bind(this)])
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

  private createNgPackgrCompiler(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>) {
    const nodeModulesPaths = this.getNodeModulesPaths(false);
    return this.ngPackagrAspect.createCompiler(this.ngPackagr, this.readDefaultTsConfig, tsCompilerOptions, bitCompilerOptions, nodeModulesPaths);
  }

  /**
   * Returns a compiler
   * Required for making and reading dists, especially for `bit compile`
   */
  getCompiler(tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>) {
    const babelCompiler = this.babel.createCompiler({ babelTransformOptions: {
        presets,
        plugins,
        sourceMaps: true,
      }, shouldCopyNonSupportedFiles: false, supportedFilesGlobPatterns: [NG_APP_PATTERN]});
    const ngPackagrCompiler = this.createNgPackgrCompiler(tsCompilerOptions, bitCompilerOptions);
    return this.multicompiler.createCompiler([babelCompiler, ngPackagrCompiler]);
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
  async getBundler(context: BundlerContext | (BundlerContext & AppBuildContext), transformers: any[] = []): Promise<Bundler> {
    const nodeModulesPaths = this.getNodeModulesPaths(true);
    return this.angularWebpack.createBundler(context, transformers, nodeModulesPaths);
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
    const nodeModulesPaths = this.getNodeModulesPaths(false);
    return this.angularWebpack.createDevServer(context, transformers, nodeModulesPaths);
  }

  /**
   * Required to use the old preview code until the envs are updated to use the new version
   */
  getPreviewConfig() {
    return {
      strategyName: 'env',
      splitComponentBundle: false
    }
  }
}

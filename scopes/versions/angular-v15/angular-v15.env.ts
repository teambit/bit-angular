import { BrowserOptions, DevServerOptions } from '@teambit/angular-apps';
import { AngularBaseEnv, AngularEnvOptions } from '@teambit/angular-base';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { BabelMain } from '@teambit/babel';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerMain } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { LoggerMain } from '@teambit/logger';
import { PkgMain } from '@teambit/pkg';
import { EnvPreviewConfig } from '@teambit/preview';
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { WebpackConfigTransformer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV15Aspect } from './angular-v15.aspect';
import { AngularV15Webpack } from './angular-v15.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV15Env extends AngularBaseEnv {
  name = 'Angular-v15';
  angularWebpack: AngularV15Webpack;
  ngPackagr = require.resolve('ng-packagr');
  elements = require.resolve('@angular/elements');
  readDefaultTsConfig = require.resolve('ng-packagr/lib/ts/tsconfig');
  jestConfigPath = require.resolve('./jest/jest.config');
  jestModulePath = require.resolve('jest');

  constructor(
    jestAspect: JestMain,
    compiler: CompilerMain,
    tester: TesterMain,
    eslint: ESLintMain,
    generator: GeneratorMain,
    isolator: IsolatorMain,
    private webpackMain: WebpackMain,
    protected workspace: Workspace | undefined,
    private pkg: PkgMain,
    application: ApplicationMain,
    aspectLoader: AspectLoaderMain,
    dependencyResolver: DependencyResolverMain,
    private react: ReactMain,
    loggerMain: LoggerMain,
    compositions: CompositionsMain,
    babel: BabelMain,
    options: AngularEnvOptions,
  ) {
    super(jestAspect, compiler, tester, eslint, isolator, workspace, generator, application, aspectLoader, dependencyResolver, loggerMain, compositions, babel, options);
    this.angularWebpack = new AngularV15Webpack(this.workspace, this.webpackMain, this.pkg, application, this.getNgEnvOptions());

    // Disable v8-caching because it breaks ESM loaders
    NativeCompileCache.uninstall();
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v15'
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV15Aspect.id;
    return id || AngularV15Aspect.id;
  }

  /**
   * Returns the list of dependencies
   * Required for any task
   */
  async getDependencies() {
    return {
      dependencies: {
        '@angular/common': '-',
        '@angular/core': '-',
        'tslib': '^2.4.1',
        'rxjs': '-',
        'zone.js': '-'
      },
      devDependencies: {
        '@angular/compiler': '~15.0.2',
        '@angular/compiler-cli': '~15.0.2',
        '@types/jest': '^29.2.4',
        '@types/node': '^14.15.0',
        'jest': '^29.3.1',
        'jest-preset-angular': '~12.2.3',
        'typescript': '-'
      },
      peerDependencies: {
        '@angular/common': '~15.0.2',
        '@angular/core': '~15.0.2',
        '@angular/platform-browser': '~15.0.2',
        '@angular/platform-browser-dynamic': '~15.0.2',
        'rxjs': '~7.5.7',
        'zone.js': '~0.12.0',
        'typescript': '~4.8.2'
      }
    };
  }

  /**
   * Returns a paths to a function which mounts a given component to DOM
   * Required for `bit build`
   */
  override getMounter(ngEnvOptions?: AngularEnvOptions) {
    if (!this.useNgElementsPreview(ngEnvOptions)) {
      return super.getMounter(ngEnvOptions);
    }
    return ngEnvOptions?.mountTemplatePath ?? require.resolve('@teambit/angular-elements/dist/preview/mount.js');
  }

  /**
   * Returns a path to a docs template.
   * Required for `bit build`
   */
  override getDocsTemplate(ngEnvOptions?: AngularEnvOptions) {
    if (!this.useNgElementsPreview(ngEnvOptions)) {
      return super.getDocsTemplate(ngEnvOptions);
    }
    return ngEnvOptions?.docsTemplatePath ?? require.resolve('@teambit/angular-elements/dist/preview/docs.js');
  }

  /**
   * Returns a bundler for the preview.
   * Required for `bit build`
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async getBundler(context: BundlerContext, transformers: any[], angularBuildOptions: Partial<BrowserOptions> = {}, sourceRoot?: string, ngEnvOptions?: AngularEnvOptions): Promise<Bundler> {
    if (this.isAppBuildContext(context) || !this.useNgElementsPreview(ngEnvOptions)) {
      return super.getBundler(context, transformers, angularBuildOptions, sourceRoot, ngEnvOptions);
    }
    return this.react.env.getBundler(context, transformers);
  }

  /**
   * Returns and configures the dev server.
   * Required for `bit start`
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = [], angularServeOptions: Partial<BrowserOptions & DevServerOptions> = {}, sourceRoot?: string, ngEnvOptions?: AngularEnvOptions): Promise<DevServer> {
    if (this.isAppContext(context) || !this.useNgElementsPreview(ngEnvOptions)) {
      return super.getDevServer(context, transformers, angularServeOptions, sourceRoot, ngEnvOptions);
    }
    return this.react.env.getDevServer(context, transformers);
  }

  /**
   * Used to configure peer dependencies from host env
   */
  override getAdditionalHostDependencies(ngEnvOptions?: AngularEnvOptions): string[] {
    if (!this.useNgElementsPreview(ngEnvOptions)) {
      return super.getAdditionalHostDependencies(ngEnvOptions);
    }
    // Add react as a shared peer dependency
    return super.getAdditionalHostDependencies().concat(['react']);
  }

  /**
   * Required to use the new preview code
   */
  override getPreviewConfig(ngEnvOptions?: AngularEnvOptions): EnvPreviewConfig {
    if (!this.useNgElementsPreview(ngEnvOptions)) {
      return super.getPreviewConfig(ngEnvOptions);
    }
    return {
      strategyName: 'component',
      splitComponentBundle: false
    };
  }
}

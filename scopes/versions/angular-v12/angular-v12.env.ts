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
import { WebpackConfigTransformer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Webpack } from './angular-v12.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV12Env extends AngularBaseEnv {
  name = 'Angular-v12';
  angularWebpack: AngularV12Webpack;
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
    protected options: AngularEnvOptions,
  ) {
    super(jestAspect, compiler, tester, eslint, isolator, workspace, generator, application, aspectLoader, dependencyResolver, loggerMain, compositions, babel, options);
    this.angularWebpack = new AngularV12Webpack(this.workspace, this.webpackMain, this.pkg, application, this.getNgEnvOptions());
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v12',
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV12Aspect.id;
    return id || AngularV12Aspect.id;
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
        'tslib': '^2.2.0',
        'rxjs': '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '^12.2.16',
        '@angular/compiler-cli': '^12.2.16',
        '@types/jest': '~27.0.2',
        '@types/node': '^12.11.1',
        'jest': '~27.0.4',
        'jest-preset-angular': '~10.0.1',
        'typescript': '-',
      },
      peerDependencies: {
        '@angular/common': '^12.2.16',
        '@angular/core': '^12.2.16',
        '@angular/platform-browser': '^12.2.16',
        '@angular/platform-browser-dynamic': '^12.2.16',
        'rxjs': '^6.6.7',
        'zone.js': '~0.11.4',
        'typescript': '~4.3.2',
      },
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
    return super.getAdditionalHostDependencies(ngEnvOptions).concat(['react']);
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

import { AngularBaseEnv, AngularEnvOptions } from '@teambit/angular-base';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerMain } from '@teambit/compiler';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { NgMultiCompilerMain } from '@teambit/ng-multi-compiler';
import { PkgMain } from '@teambit/pkg';
import { EnvPreviewConfig } from '@teambit/preview';
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { WebpackConfigTransformer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularElementsMain } from '@teambit/angular-elements';
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
    ngMultiCompiler: NgMultiCompilerMain,
    generator: GeneratorMain,
    isolator: IsolatorMain,
    private webpackMain: WebpackMain,
    protected workspace: Workspace | undefined,
    private pkg: PkgMain,
    application: ApplicationMain,
    aspectLoader: AspectLoaderMain,
    dependencyResolver: DependencyResolverMain,
    private react: ReactMain,
    protected options: AngularEnvOptions,
    angularElements?: AngularElementsMain
  ) {
    super(jestAspect, compiler, tester, eslint, ngMultiCompiler, isolator, workspace, generator, application, aspectLoader, dependencyResolver, options, angularElements);
    this.angularWebpack = new AngularV12Webpack(this.workspace, this.webpackMain, this.pkg, application);
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
  override getMounter() {
    if (!this.useAngularElements) {
      return super.getMounter();
    }
    return require.resolve('@teambit/angular-elements/dist/preview/mount.js');
  }

  /**
   * Returns a path to a docs template.
   * Required for `bit build`
   */
  override getDocsTemplate() {
    if (!this.useAngularElements) {
      return super.getDocsTemplate();
    }
    return require.resolve('@teambit/angular-elements/dist/preview/docs.js');
  }

  /**
   * Returns a bundler for the preview.
   * Required for `bit build`
   */
  override async getBundler(context: BundlerContext, transformers: any[]): Promise<Bundler> {
    if (this.isAppBuildContext(context) || !this.useAngularElements) {
      return super.getBundler(context, transformers);
    }
    return this.react.env.getBundler(context, transformers);
  }

  /**
   * Returns and configures the dev server.
   * Required for `bit start`
   */
  override async getDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    if (this.isAppContext(context) || !this.useAngularElements) {
      return super.getDevServer(context, transformers);
    }
    return this.react.env.getDevServer(context, transformers);
  }

  /**
   * Required to use the new preview code
   */
  override getPreviewConfig(): EnvPreviewConfig {
    if (!this.useAngularElements) {
      return super.getPreviewConfig();
    }
    return {
      strategyName: 'component',
      splitComponentBundle: false
    };
  }
}

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
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { WebpackConfigTransformer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularElementsMain } from '@teambit/angular-elements';
import { AngularV13Aspect } from './angular-v13.aspect';
import { AngularV13Webpack } from './angular-v13.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV13Env extends AngularBaseEnv {
  name = 'Angular-v13';
  angularWebpack: AngularV13Webpack;
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
    options: AngularEnvOptions,
    angularElements: AngularElementsMain,
  ) {
    super(jestAspect, compiler, tester, eslint, ngMultiCompiler, isolator, workspace, generator, application, aspectLoader, dependencyResolver, options, angularElements);
    this.angularWebpack = new AngularV13Webpack(this.workspace, this.webpackMain, this.pkg, application);

    // Disable v8-caching because it breaks ESM loaders
    NativeCompileCache.uninstall();
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v13'
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV13Aspect.id;
    return id || AngularV13Aspect.id;
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
        'tslib': '^2.3.0',
        'rxjs': '-',
        'zone.js': '-'
      },
      devDependencies: {
        '@angular/compiler': '~13.2.0',
        '@angular/compiler-cli': '~13.2.0',
        '@types/jest': '^27.0.3',
        '@types/node': '^12.11.1',
        'jest': '^27.4.4',
        'jest-preset-angular': '~11.0.1',
        'typescript': '-'
      },
      peerDependencies: {
        '@angular/common': '~13.2.0',
        '@angular/core': '~13.2.0',
        '@angular/platform-browser': '~13.2.0',
        '@angular/platform-browser-dynamic': '~13.2.0',
        'rxjs': '~7.4.0',
        'zone.js': '~0.11.4',
        'typescript': '~4.5.2'
      }
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
   * Required for `bit build` & `build start`
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

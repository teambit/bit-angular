import { AngularEnv } from '@teambit/angular';
import { CompilerMain } from '@teambit/compiler';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { PkgMain } from '@teambit/pkg';
import { TesterMain } from '@teambit/tester';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV13Aspect } from './angular-v13.aspect';
import { AngularV13Webpack } from './angular-v13.webpack';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { MultiCompilerMain } from '@teambit/multi-compiler';
import { BabelMain } from '@teambit/babel';
import { DependencyResolverMain } from '@teambit/dependency-resolver';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV13Env extends AngularEnv {
  name = 'Angular-v13';
  angularWebpack: AngularV13Webpack;
  ngPackagr = require.resolve('ng-packagr');
  readDefaultTsConfig = require.resolve('ng-packagr/lib/ts/tsconfig');
  jestConfigPath = require.resolve('./jest/jest.config');
  jestModulePath = require.resolve('jest');

  constructor(
    jestAspect: JestMain,
    compiler: CompilerMain,
    tester: TesterMain,
    eslint: ESLintMain,
    ngPackagrAspect: NgPackagrMain,
    generator: GeneratorMain,
    isolator: IsolatorMain,
    private webpackMain: WebpackMain,
    protected workspace: Workspace | undefined,
    private pkg: PkgMain,
    application: ApplicationMain,
    aspectLoader: AspectLoaderMain,
    multicompiler: MultiCompilerMain,
    babel: BabelMain,
    dependencyResolver: DependencyResolverMain,
  ) {
    super(jestAspect, compiler, tester, eslint, ngPackagrAspect, isolator, workspace, generator, application, aspectLoader, multicompiler, babel, dependencyResolver);
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
}

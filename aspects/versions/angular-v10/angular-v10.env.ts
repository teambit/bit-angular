import { AngularBaseEnv, AngularEnvOptions } from '@teambit/angular-base';
import { AngularElementsMain } from '@teambit/angular-elements';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { CompilerMain } from '@teambit/compiler';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { NgMultiCompilerMain } from '@teambit/ng-multi-compiler';
import { PkgMain } from '@teambit/pkg';
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV10Aspect } from './angular-v10.aspect';
import { AngularV10Webpack } from './angular-v10.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV10Env extends AngularBaseEnv {
  name = 'Angular-v10';
  angularWebpack: AngularV10Webpack;
  ngPackagr = require.resolve('ng-packagr');
  elements = null;
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
    angularElements?: AngularElementsMain
  ) {
    super(jestAspect, compiler, tester, eslint, ngMultiCompiler, isolator, workspace, generator, application, aspectLoader, dependencyResolver, options, angularElements);
    this.angularWebpack = new AngularV10Webpack(this.workspace, this.webpackMain, this.pkg, application);
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v10',
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV10Aspect.id;
    return id || AngularV10Aspect.id;
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
        'tslib': '^2.0.0',
        'rxjs': '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '~10.2.5',
        '@angular/compiler-cli': '~10.2.5',
        '@types/jest': '~27.0.2',
        '@types/node': '^12.11.1',
        'jest': '~27.0.4',
        'jest-preset-angular': '~10.0.1',
        'typescript': '-',
      },
      peerDependencies: {
        '@angular/common': '~10.2.5',
        '@angular/core': '~10.2.5',
        '@angular/platform-browser': '~10.2.5',
        '@angular/platform-browser-dynamic': '~10.2.5',
        'rxjs': '^6.6.3',
        'zone.js': '~0.10.3',
        'typescript': '~4.0.2',
      },
    };
  }
}

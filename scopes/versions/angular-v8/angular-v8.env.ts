import { AngularBaseEnv, AngularEnvOptions } from '@teambit/angular-base';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { BabelMain } from '@teambit/babel';
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
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV8Aspect } from './angular-v8.aspect';
import { AngularV8Webpack } from './angular-v8.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV8Env extends AngularBaseEnv {
  name = 'Angular-v8';
  angularWebpack: AngularV8Webpack;
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
    this.angularWebpack = new AngularV8Webpack(this.workspace, this.webpackMain, this.pkg, application, this.getNgEnvOptions());
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v8',
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV8Aspect.id;
    return id || AngularV8Aspect.id;
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
        'tslib': '^1.10.0',
        'rxjs': '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '~8.2.14',
        '@angular/compiler-cli': '~8.2.14',
        '@types/jest': '~25.1.0',
        '@types/node': '^12.11.1',
        'jest': '^25.1.0',
        'jest-preset-angular': '~8.2.0',
        'ts-jest': '^25.5.1',
        'typescript': '-',
      },
      peerDependencies: {
        '@angular/common': '~8.2.14',
        '@angular/core': '~8.2.14',
        '@angular/platform-browser': '~8.2.14',
        '@angular/platform-browser-dynamic': '~8.2.14',
        'rxjs': '~6.4.0',
        'zone.js': '~0.9.1',
        'typescript': '~3.5.3',
      },
    };
  }
}

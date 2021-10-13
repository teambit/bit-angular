import { AngularEnv } from '@teambit/angular';
import { CompilerMain } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { IsolatorMain } from '@teambit/isolator';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { PkgMain } from '@teambit/pkg';
import { GeneratorMain } from '@teambit/generator';
import { AngularV8Aspect } from './angular-v8.aspect';
import { AngularV8Webpack } from './angular-v8.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV8Env extends AngularEnv {
  name = 'Angular-v8';
  angularWebpack = new AngularV8Webpack(this.workspace, this.webpackMain, this.compositions, this.pkg, this.nodeModulesPaths);
  ngPackagr = require.resolve('ng-packagr');
  readDefaultTsConfig = require.resolve('ng-packagr/lib/ts/tsconfig');
  jestConfigPath = require.resolve('./jest/jest.config');
  jestModulePath = require.resolve('jest');

  constructor(
    jestAspect: JestMain,
    compiler: CompilerMain,
    eslint: ESLintMain,
    ngPackagrAspect: NgPackagrMain,
    generator: GeneratorMain,
    isolator: IsolatorMain,
    private webpackMain: WebpackMain,
    private workspace: Workspace | undefined,
    private compositions: CompositionsMain,
    private pkg: PkgMain,
  ) {
    super(jestAspect, compiler, eslint, ngPackagrAspect, isolator, workspace, generator);
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
        tslib: '^1.10.0',
        rxjs: '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '~8.2.14',
        '@angular/compiler-cli': '~8.2.14',
        'jest': '^26.6.3',
        'jest-preset-angular': '~8.4.0',
        'ts-jest': '^26.0.0',
        typescript: '-',
      },
      peerDependencies: {
        '@angular/common': '~8.2.14',
        '@angular/core': '~8.2.14',
        '@angular/platform-browser': '~8.2.14',
        '@angular/platform-browser-dynamic': '~8.2.14',
        rxjs: '~6.4.0',
        'zone.js': '~0.9.1',
        typescript: '~3.5.3',
      },
    };
  }
}

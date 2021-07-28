import { AngularEnv } from '@teambit/angular';
import { CompilerMain } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { NgPackagr, NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { ngPackagr } from 'ng-packagr';
import { GeneratorMain } from '@teambit/generator';
import { AngularV9Aspect } from './angular-v9.aspect';
import { AngularV9Webpack } from './angular-v9.webpack';
import { readDefaultTsConfig } from 'ng-packagr/lib/ts/tsconfig';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV9Env extends AngularEnv {
  name = 'Angular-v9';
  angularWebpack = new AngularV9Webpack(this.workspace, this.webpackMain, this.compositions);
  ngPackagr = ngPackagr() as NgPackagr;
  readDefaultTsConfig = readDefaultTsConfig;

  constructor(
    jestAspect: JestMain,
    compiler: CompilerMain,
    eslint: ESLintMain,
    ngPackagrAspect: NgPackagrMain,
    generator: GeneratorMain,
    private webpackMain: WebpackMain,
    private workspace: Workspace,
    private compositions: CompositionsMain
  ) {
    super(jestAspect, compiler, eslint, ngPackagrAspect, generator);
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v9',
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV9Aspect.id;
    return id || AngularV9Aspect.id;
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
        '@angular/compiler': '~9.1.13',
        '@angular/compiler-cli': '~9.1.13',
        'jest': '~27.0.4',
        'jest-preset-angular': '~9.0.4',
        typescript: '-',
      },
      peerDependencies: {
        '@angular/common': '~9.1.13',
        '@angular/core': '~9.1.13',
        '@angular/platform-browser': '~9.1.13',
        '@angular/platform-browser-dynamic': '~9.1.13',
        rxjs: '^6.6.3',
        'zone.js': '^0.10.3',
        typescript: '~3.8.3',
      },
    };
  }
}

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
import { AngularV10Aspect } from './angular-v10.aspect';
import { AngularV10Webpack } from './angular-v10.webpack';
import { readDefaultTsConfig } from 'ng-packagr/lib/ts/tsconfig';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV10Env extends AngularEnv {
  name = 'Angular-v10';
  angularWebpack = new AngularV10Webpack(this.workspace, this.webpackMain, this.compositions);
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
        tslib: '^2.0.0',
        rxjs: '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '~10.2.5',
        '@angular/compiler-cli': '~10.2.5',
        'jest': '~27.0.4',
        'jest-preset-angular': '~9.0.4',
        typescript: '-',
      },
      peerDependencies: {
        '@angular/common': '~10.2.5',
        '@angular/core': '~10.2.5',
        '@angular/platform-browser': '~10.2.5',
        '@angular/platform-browser-dynamic': '~10.2.5',
        rxjs: '^6.6.3',
        'zone.js': '^0.10.3',
        typescript: '~4.0.2',
      },
    };
  }
}

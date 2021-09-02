import { AngularEnv } from '@teambit/angular';
import { CompilerMain } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { IsolatorMain } from '@teambit/isolator';
import { NgPackagr, NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { ngPackagr } from 'ng-packagr';
import { GeneratorMain } from '@teambit/generator';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Webpack } from './angular-v12.webpack';
import { readDefaultTsConfig } from 'ng-packagr/lib/ts/tsconfig';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV12Env extends AngularEnv {
  name = 'Angular-v12';
  angularWebpack = new AngularV12Webpack(this.workspace, this.webpackMain, this.compositions, this.scopeAspectsRootDir);
  ngPackagr = ngPackagr() as NgPackagr;
  readDefaultTsConfig = readDefaultTsConfig;

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
  ) {
    super(jestAspect, compiler, eslint, ngPackagrAspect, isolator, workspace, generator);
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
        tslib: '^2.2.0',
        rxjs: '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '12.1.0',
        '@angular/compiler-cli': '12.1.0',
        'jest': '~27.0.4',
        'jest-preset-angular': '~9.0.4',
        typescript: '-',
      },
      peerDependencies: {
        '@angular/common': '12.1.0',
        '@angular/core': '12.1.0',
        '@angular/platform-browser': '12.1.0',
        '@angular/platform-browser-dynamic': '12.1.0',
        rxjs: '^6.6.7',
        'zone.js': '~0.11.4',
        typescript: '~4.3.2',
      },
    };
  }
}

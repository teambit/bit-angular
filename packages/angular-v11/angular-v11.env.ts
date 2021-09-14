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
import { AngularV11Aspect } from './angular-v11.aspect';
import { AngularV11Webpack } from './angular-v11.webpack';
import { readDefaultTsConfig } from 'ng-packagr/lib/ts/tsconfig';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV11Env extends AngularEnv {
  name = 'Angular-v11';
  angularWebpack = new AngularV11Webpack(this.workspace, this.webpackMain, this.compositions, this.nodeModulesPaths);
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
      type: 'angular-v11',
    };
  }

  /**
   * Required for `bit start`
   */
  getDevEnvId(id?: string) {
    if (typeof id !== 'string') return AngularV11Aspect.id;
    return id || AngularV11Aspect.id;
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
        '@angular/compiler': '~11.2.14',
        '@angular/compiler-cli': '~11.2.14',
        'jest': '~27.0.4',
        'jest-preset-angular': '~9.0.4',
        typescript: '-',
      },
      peerDependencies: {
        '@angular/common': '~11.2.14',
        '@angular/core': '~11.2.14',
        '@angular/platform-browser': '~11.2.14',
        '@angular/platform-browser-dynamic': '~11.2.14',
        rxjs: '^6.6.3',
        'zone.js': '~0.11.4',
        typescript: '~4.1.5',
      },
    };
  }
}

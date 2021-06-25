import { AngularEnv } from '@teambit/angular';
import { CompilerMain } from '@teambit/compiler';
import { CompositionsMain } from '@teambit/compositions';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { ngPackagr } from 'ng-packagr';
import { GeneratorMain } from '@teambit/generator';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Webpack } from './angular-v12.webpack';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV12Env extends AngularEnv {
  name = 'Angular-v12';
  angularWebpack = new AngularV12Webpack(this.workspace, this.webpackMain, this.compositions);
  ngPackagr = ngPackagr();

  constructor(
    jestAspect: JestMain,
    compiler: CompilerMain,
    eslint: ESLintMain,
    ngPackagrAspect: NgPackagrMain,
    generator: GeneratorMain,
    private webpackMain: WebpackMain,
    private workspace: Workspace,
    private compositions: CompositionsMain,
  ) {
    super(jestAspect, compiler, eslint, ngPackagrAspect, generator);
  }

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  async __getDescriptor(): Promise<EnvDescriptor> {
    return {
      type: 'angular-v12'
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
        'zone.js': '-'
      },
      devDependencies: {
        typescript: '-'
      },
      peerDependencies: {
        '@angular/common': '~12.1.0',
        '@angular/core': '~12.1.0',
        'rxjs': '^6.6.7',
        'zone.js': '~0.11.4',
        'typescript': '~4.3.2'
      }
    };
  }
}
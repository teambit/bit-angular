import { AngularBaseEnv } from '@teambit/angular-base';
import { CompilerMain } from '@teambit/compiler';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { IsolatorMain } from '@teambit/isolator';
import { TesterMain } from '@teambit/tester';
import { PkgMain } from '@teambit/pkg';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { GeneratorMain } from '@teambit/generator';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Webpack } from './angular-v12.webpack';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { MultiCompilerMain } from '@teambit/multi-compiler';
import { BabelMain } from '@teambit/babel';
import { DependencyResolverMain } from '@teambit/dependency-resolver';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV12Env extends AngularBaseEnv {
  name = 'Angular-v12';
  angularWebpack: AngularV12Webpack;
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
    this.angularWebpack = new AngularV12Webpack(this.workspace, this.webpackMain, this.pkg, application);
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
        'tslib': '^2.2.0',
        'rxjs': '-',
        'zone.js': '-',
      },
      devDependencies: {
        '@angular/compiler': '^12.2.16',
        '@angular/compiler-cli': '^12.2.16',
        '@types/jest': '~27.0.2',
        '@types/node': '^12.11.1',
        'jest': '~27.0.4',
        'jest-preset-angular': '~10.0.1',
        'typescript': '-',
      },
      peerDependencies: {
        '@angular/common': '^12.2.16',
        '@angular/core': '^12.2.16',
        '@angular/platform-browser': '^12.2.16',
        '@angular/platform-browser-dynamic': '^12.2.16',
        'rxjs': '^6.6.7',
        'zone.js': '~0.11.4',
        'typescript': '~4.3.2',
      },
    };
  }
}

import { AngularEnv } from '@teambit/angular';
import { CompilerMain } from '@teambit/compiler';
import { EnvDescriptor } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { JestMain } from '@teambit/jest';
import { IsolatorMain } from '@teambit/isolator';
import { TesterMain } from '@teambit/tester';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { GeneratorMain } from '@teambit/generator';
import { PkgMain } from '@teambit/pkg';
import { AngularV10Aspect } from './angular-v10.aspect';
import { AngularV10Webpack } from './angular-v10.webpack';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { MultiCompilerMain } from '@teambit/multi-compiler';
import { BabelMain } from '@teambit/babel';
import { DependencyResolverMain } from '@teambit/dependency-resolver';

/**
 * a component environment built for [Angular](https://angular.io).
 */
export class AngularV10Env extends AngularEnv {
  name = 'Angular-v10';
  angularWebpack: AngularV10Webpack;
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

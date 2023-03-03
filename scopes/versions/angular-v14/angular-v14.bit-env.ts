import { AngularBaseEnv } from '@teambit/angular-base';
import { AngularEnvOptions } from '@teambit/angular-common';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { webpackConfigFactory } from './webpack-config.factory';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularV14Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'Angular-v14';
  packageName = '@teambit/angular-v14';
  angularVersion = 14;

  ngEnvOptions: AngularEnvOptions = {
    useNgcc: false,
    useAngularElementsPreview: false,
    // angularElementsModulePath: require.resolve('@angular/elements'),
    jestConfigPath: require.resolve('./jest/jest.config'),
    jestModulePath: require.resolve('jest'),
    ngPackagrModulePath: require.resolve('ng-packagr'),
    readDefaultTsConfig: require.resolve('ng-packagr/lib/ts/tsconfig'),
    webpackConfigFactory: webpackConfigFactory,
    webpackDevServerModulePath: require.resolve('webpack-dev-server'),
    // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
    // otherwise, if we use a different version, it would break
    webpackModulePath: require.resolve('webpack', { paths: [require.resolve('@angular-devkit/build-angular')] })
  };
}

export default new AngularV14Env();

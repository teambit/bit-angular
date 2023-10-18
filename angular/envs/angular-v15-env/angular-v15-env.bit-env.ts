import { AngularBaseEnv } from '@bitdev/angular.envs.base-env';
import { AngularEnvOptions } from '@bitdev/angular.dev-services.common';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { webpackConfigFactory } from './webpack-config.factory';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularV15Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'Aangular-v15-env';

  angularVersion = 15;

  ngEnvOptions: AngularEnvOptions = {
    useAngularElementsPreview: false,
    // angularElementsModulePath: require.resolve('@angular/elements'),
    jestConfigPath: require.resolve('./jest/jest.config'),
    jestModulePath: require.resolve('jest'),
    ngPackagrModulePath: require.resolve('ng-packagr'),
    readDefaultTsConfig: require.resolve('ng-packagr/lib/ts/tsconfig'),
    webpackConfigFactory,
    webpackDevServerModulePath: require.resolve('webpack-dev-server'),
    // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
    // otherwise, if we use a different version, it would break
    webpackModulePath: require.resolve('webpack', { paths: [require.resolve('@angular-devkit/build-angular')] })
  };
}

export default new AngularV15Env();

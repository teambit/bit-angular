import { AngularEnvOptions } from '@bitdev/angular.dev-services.common';
import { AngularBaseEnv } from '@bitdev/angular.envs.base-env';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { createRequire } from 'node:module';
import { webpackConfigFactory } from './webpack-config.factory.js';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

const require = createRequire(import.meta.url);

export const ngEnvOptions: AngularEnvOptions = {
  useAngularElementsPreview: false,
  // angularElementsModulePath: require.resolve('@angular/elements'),
  jestConfigPath: require.resolve('./jest/jest.config.cjs'),
  jestModulePath: require.resolve('jest'),
  ngPackagrModulePath: import.meta.resolve('ng-packagr'),
  webpackConfigFactory,
  webpackDevServerModulePath: require.resolve('webpack-dev-server'),
  // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
  // otherwise, if we use a different version, it would break
  webpackModulePath: require.resolve('webpack', { paths: [require.resolve('@angular-devkit/build-angular')] })
}

export class AngularV13Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'angular-v13-env';

  angularVersion = 13;

  ngEnvOptions: AngularEnvOptions = ngEnvOptions;
}

export default new AngularV13Env();

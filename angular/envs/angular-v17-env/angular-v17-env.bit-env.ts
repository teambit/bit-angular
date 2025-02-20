import { AngularEnvOptions } from '@bitdev/angular.dev-services.common';
import { AngularBaseEnv } from '@bitdev/angular.envs.base-env';
import { createRequire } from 'node:module';
import { webpackConfigFactory } from './webpack-config.factory.js';

const require = createRequire(import.meta.url);

export const ngEnvOptions: AngularEnvOptions = {
  useAngularElements: false,
  angularElementsModulePath: require.resolve('@angular/elements'),
  jestModulePath: require.resolve('jest'),
  ngPackagrModulePath: require.resolve('ng-packagr'),
  webpackConfigFactory,
  webpackDevServerModulePath: require.resolve('webpack-dev-server'),
  // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
  // otherwise, if we use a different version, it would break
  webpackModulePath: require.resolve('webpack', { paths: [require.resolve('@angular-devkit/build-angular')] }),
  // devServer: 'vite',
};

export class AngularV17Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'angular-v17-env';

  angularVersion = 17;

  ngEnvOptions: AngularEnvOptions = ngEnvOptions;

  /* Jest config. Learn how to replace tester - https://bit.dev/reference/testing/set-up-tester */
  protected jestConfigPath = require.resolve('./jest/jest.config.cjs');
}

export default new AngularV17Env();

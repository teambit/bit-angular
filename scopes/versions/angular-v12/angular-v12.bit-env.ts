import { AngularBaseEnv } from '@teambit/angular-base';
import { AngularEnvOptions } from '@teambit/angular-common';
import { webpackConfigFactory } from './webpack-config.factory';

export class AngularV12Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'Angular-v12';
  angularVersion = 12;

  ngEnvOptions: AngularEnvOptions = {
    useNgcc: true,
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

export default new AngularV12Env();

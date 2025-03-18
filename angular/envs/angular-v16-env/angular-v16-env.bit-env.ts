import { AngularEnvOptions } from '@bitdev/angular.dev-services.common';
import { AngularPreview } from "@bitdev/angular.dev-services.preview.preview";
import { AngularBaseEnv } from '@bitdev/angular.envs.base-env';
import { EnvHandler } from '@teambit/envs';
import { Preview } from '@teambit/preview';
import { createRequire } from 'node:module';
import { webpackConfigFactory } from './webpack-config.factory.js';

const require = createRequire(import.meta.url);

export const ngEnvOptions: AngularEnvOptions = {
  jestModulePath: require.resolve('jest'),
  ngPackagrModulePath: require.resolve('ng-packagr'),
  webpackConfigFactory,
  webpackDevServerModulePath: require.resolve('webpack-dev-server'),
  // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
  // otherwise, if we use a different version, it would break
  webpackModulePath: require.resolve('webpack', { paths: [require.resolve('@angular-devkit/build-angular')] }),
  // devServer: 'webpack',
};

export class AngularV16Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'angular-v16-env';

  angularVersion = 16;

  ngEnvOptions: AngularEnvOptions = ngEnvOptions;

  /* Jest config. Learn how to replace tester - https://bit.dev/reference/testing/set-up-tester */
  protected jestConfigPath = require.resolve('./jest/jest.config.cjs');

  /**
   * Esbuild plugins are not supported in Angular v16 and required for the preview, so we can't use vite dev server.
   * Instead, we use the old webpack dev server.
   */
  override preview(): EnvHandler<Preview> {
    return AngularPreview.from({
      ngEnvOptions: this.getNgEnvOptions(),
      hostDependencies: [
        '@teambit/mdx.ui.mdx-scope-context',
        '@mdx-js/react',
        'react',
        'react-dom',
      ],
      mounterPath: require.resolve('./config/mounter.js')
    });
  }
}

export default new AngularV16Env();

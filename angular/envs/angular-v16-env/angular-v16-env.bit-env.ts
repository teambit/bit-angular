import {
  AngularEnvOptions,
  BrowserOptions,
  DevServerOptions,
  isAppDevContext
} from '@bitdev/angular.dev-services.common';
import { NgViteDevServer, ViteConfigTransformer } from '@bitdev/angular.dev-services.vite';
import { AngularBaseEnv } from '@bitdev/angular.envs.base-env';
import { DevServer, DevServerContext } from '@teambit/bundler';
import { AsyncEnvHandler } from '@teambit/envs';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import {
  Configuration,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer
} from '@teambit/webpack';
import { webpackConfigFactory } from './webpack-config.factory';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularV16Env extends AngularBaseEnv {
  /**
   * name of the environment. used for friendly mentions across bit.
   */
  name = 'angular-v16-env';

  angularVersion = 16;

  ngEnvOptions: AngularEnvOptions = {
    useNgcc: false,
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
    webpackModulePath: require.resolve('webpack', { paths: [require.resolve('@angular-devkit/build-angular')] }),
    devServer: 'webpack',
  };

  override getDevServer(
    devServerContext: DevServerContext,
    ngEnvOptions: AngularEnvOptions,
    transformers: (WebpackConfigTransformer | ViteConfigTransformer)[] = [],
    angularOptions: Partial<BrowserOptions & DevServerOptions> = {},
    webpackOptions: Partial<WebpackConfigWithDevServer | Configuration> = {},
    sourceRoot?: string
  ): AsyncEnvHandler<DevServer> {
    if (this.ngEnvOptions.devServer === 'vite' && isAppDevContext(devServerContext)) {
      return NgViteDevServer.from({
        angularOptions,
        devServerContext,
        ngEnvOptions,
        sourceRoot,
        transformers,
        webpackOptions
      });
    }
    return super.getDevServer(devServerContext, ngEnvOptions, transformers as WebpackConfigTransformer[], angularOptions, webpackOptions, sourceRoot);
  }
}

export default new AngularV16Env();

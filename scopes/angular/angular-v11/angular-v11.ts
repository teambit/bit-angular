import { DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { getCompilerConfig } from '@angular-devkit/build-angular/src/browser';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import {
  BuildBrowserFeatures,
  normalizeBrowserSchema,
  normalizeOptimization
} from '@angular-devkit/build-angular/src/utils';
import { generateEntryPoints } from '@angular-devkit/build-angular/src/utils/package-chunk-sort';
import {
  BrowserWebpackConfigOptions,
  generateWebpackConfig,
  getIndexOutputFile
} from '@angular-devkit/build-angular/src/utils/webpack-browser-config';
import {
  getBrowserConfig,
  getCommonConfig,
  getDevServerConfig,
  getStatsConfig,
  getStylesConfig
} from '@angular-devkit/build-angular/src/webpack/configs';
import { IndexHtmlWebpackPlugin } from '@angular-devkit/build-angular/src/webpack/plugins/index-html-webpack-plugin';
import { getSystemPath, logging, normalize, tags } from '@angular-devkit/core';
import { AngularVersionAdapter, webpack4ConfigFactory } from '@teambit/angular';
import { DevServerContext } from '@teambit/bundler';
import { VariantPolicyConfigObject } from '@teambit/dependency-resolver';
import { Logger } from '@teambit/logger';
import { WebpackConfigWithDevServer } from '@teambit/webpack';
import { ngPackagr } from 'ng-packagr';
import path from 'path';
import webpack, { Configuration } from 'webpack';
import WsDevServer, { addDevServerEntrypoints } from 'webpack-dev-server';

export class AngularV11 implements AngularVersionAdapter {
  get dependencies(): VariantPolicyConfigObject | Promise<VariantPolicyConfigObject> {
    return {
      dependencies: {
        '@angular/common': '-',
        '@angular/core': '-',
        'tslib': '^2.0.0',
        'rxjs': '-',
        'zone.js': '-',
      },
      devDependencies: {
        typescript: '-',
      },
      peerDependencies: {
        '@angular/common': '^11.0.0',
        '@angular/core': '^11.0.0',
        'rxjs': '^6.0.0',
        'zone.js': '^0.11.0',
        'typescript': '~4.1.0',
      },
    };
  }

  get ngPackagr() {
    return ngPackagr();
  }

  get webpack() {
    return webpack;
  }

  get webpackDevServer() {
    return WsDevServer;
  }

  get webpackConfigFactory() {
    return webpack4ConfigFactory;
  }

  /**
   * Migrate options from webpack-dev-server 3 to 4
   */
  private migrateConfiguration(webpackConfig: Configuration): Configuration {
    // /**
    //  * Removed logLevel in favor of built-in logger
    //  * see https://webpack.js.org/configuration/other-options/#infrastructurelogginglevel
    //  */
    // // @ts-ignore
    // delete webpackConfig.devServer.logLevel;
    //
    /**
     * Removed contentBase in favor of the static option
     */
    // @ts-ignore
    delete webpackConfig.devServer.contentBase;
    //
    // /**
    //  * Removed publicPath in favor of the dev option
    //  */
    // // @ts-ignore
    // delete webpackConfig.devServer.publicPath;
    //
    // /**
    //  * Moved overlay to client option
    //  */
    // // @ts-ignore
    // webpackConfig.devServer.client = webpackConfig.devServer.client || {};
    // // @ts-ignore
    // webpackConfig.devServer.client.overlay = webpackConfig.devServer.overlay;
    // // @ts-ignore
    // delete webpackConfig.devServer.overlay;
    //
    // /**
    //  * Removed in favor of the static option
    //  */
    // // @ts-ignore
    // delete webpackConfig.devServer.watchOptions;
    //
    // /**
    //  * Moved sockPath to client option path
    //  */
    // // @ts-ignore
    // webpackConfig.devServer.client.path = webpackConfig.devServer.sockPath;
    // // @ts-ignore
    // delete webpackConfig.devServer.sockPath;
    //
    // /**
    //  * Removed stats in favor of the stats options from webpack
    //  */
    // // @ts-ignore
    // delete webpackConfig.devServer.stats;
    //
    // /**
    //  * Cleaning up undefined values
    //  */
    // // @ts-ignore
    // Object.keys(webpackConfig.devServer).forEach(option => {
    //   // @ts-ignore
    //   if (typeof webpackConfig.devServer[option] === 'undefined') {
    //     // @ts-ignore
    //     delete webpackConfig.devServer[option];
    //   }
    // })

    return webpackConfig;
  }

  async getDevWebpackConfig(context: DevServerContext, logger: Logger, setup: 'serve' | 'build', extraOptions: Partial<WebpackConfigWithDevServer> = {}): Promise<WebpackConfigWithDevServer> {
    // Options from angular.json
    const browserOptions: BrowserBuilderSchema = {
      baseHref: path.posix.join(context.rootPath, context.publicPath),
      preserveSymlinks: true,
      outputPath: 'public', // doesn't seem to matter ?
      index: "src/index.html",
      main: "src/main.ts",
      polyfills: "src/polyfills.ts",
      tsConfig: 'tsconfig.app.json',
      assets: [
        "src/favicon.ico",
        "src/assets"
      ],
      styles: [
        "src/styles.scss"
      ],
      scripts: [],
      vendorChunk: true,
      namedChunks: true,
      optimization: false,
      buildOptimizer: false,
      aot: true,
      deleteOutputPath: true,
      sourceMap: true,
      showCircularDependencies: true,
      // inlineStyleLanguage: InlineStyleLanguage.Scss,
      watch: true, // TODO: doesn't work
      // deployUrl: undefined,
      // subresourceIntegrity: undefined,
      // crossOrigin: undefined,
    };

    const workspaceRoot = path.resolve(require.resolve('@teambit/angular'), '../../app');
    const normalizedWorkspaceRoot = normalize(workspaceRoot);
    const projectRoot = normalize('');
    const sourceRoot = normalize('src');

    const normalizedOptions = normalizeBrowserSchema(
      normalizedWorkspaceRoot,
      projectRoot,
      sourceRoot,
      {
        ...browserOptions,
        ...extraOptions as Partial<BrowserBuilderSchema & DevServerBuilderOptions>
      }
    );

    const loggerApi = {
      createChild: () => logger as any,
      ...logger,
      log: logger.console
    } as any as logging.LoggerApi;

    const webpackConfig: Configuration = await generateWebpackConfig(
      getSystemPath(normalizedWorkspaceRoot),
      getSystemPath(projectRoot),
      getSystemPath(sourceRoot),
      normalizedOptions,
      (wco: BrowserWebpackConfigOptions) => [
        setup === 'serve' ? getDevServerConfig(wco) : {},
        getCommonConfig(wco),
        getBrowserConfig(wco),
        getStylesConfig(wco), // TODO
        getStatsConfig(wco),
        getCompilerConfig(wco),
      ],
      loggerApi,
      {}
    );

    // @ts-ignore
    if (extraOptions.liveReload && !extraOptions.hmr) {
      // This is needed because we cannot use the inline option directly in the config
      // because of the SuppressExtractedTextChunksWebpackPlugin
      // Consider not using SuppressExtractedTextChunksWebpackPlugin when liveReload is enable.
      // tslint:disable-next-line: no-any
      addDevServerEntrypoints(webpackConfig as any, {
        ...(webpackConfig as any).devServer,
        inline: true
      });

      // Remove live-reload code from all entrypoints but not main.
      // Otherwise this will break SuppressExtractedTextChunksWebpackPlugin because
      // 'addDevServerEntrypoints' adds additional entry-points to all entries.
      if (webpackConfig.entry && typeof webpackConfig.entry === 'object' && !Array.isArray(webpackConfig.entry) && webpackConfig.entry.main) {
        for (const [key, value] of Object.entries(webpackConfig.entry)) {
          if (key === 'main' || !Array.isArray(value)) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const webpackClientScriptIndex = value.findIndex(x => x.includes('webpack-dev-server/client/index.js'));
          if (webpackClientScriptIndex >= 0) {
            // Remove the webpack-dev-server/client script from array.
            value.splice(webpackClientScriptIndex, 1);
          }
        }
      }
    }

    // @ts-ignore
    if (extraOptions.hmr) {
      logger.warn(tags.stripIndents`NOTICE: Hot Module Replacement (HMR) is enabled for the dev server.
      See https://webpack.js.org/guides/hot-module-replacement for information on working with HMR for Webpack.`);
    }

    if (setup === 'serve' && browserOptions.index) {
      context.generateIndex = false;
      const { scripts = [], styles = [] } = browserOptions;
      const buildBrowserFeatures = new BuildBrowserFeatures(workspaceRoot);
      const entrypoints = generateEntryPoints({ scripts, styles });
      const normalizedIndex = normalize(browserOptions.index as string);
      const normalizedOptimization = normalizeOptimization(browserOptions.optimization);
      if (!webpackConfig.plugins) {
        webpackConfig.plugins = [];
      }
      webpackConfig.plugins.push(
        new IndexHtmlWebpackPlugin({
          indexPath: path.resolve(workspaceRoot, browserOptions.index as string),
          outputPath: getIndexOutputFile(normalizedIndex),
          baseHref: browserOptions.baseHref || '/',
          entrypoints,
          moduleEntrypoints: [],
          noModuleEntrypoints: ['polyfills-es5'],
          deployUrl: browserOptions.deployUrl,
          sri: browserOptions.subresourceIntegrity,
          optimization: normalizedOptimization,
          WOFFSupportNeeded: !buildBrowserFeatures.isFeatureSupported('woff2'),
          crossOrigin: browserOptions.crossOrigin,
          lang: 'en-US' // TODO(ocombe) support locale
        })
      );
    }

    webpackConfig.stats = 'errors-only';

    return this.migrateConfiguration(webpackConfig) as WebpackConfigWithDevServer;
  }
}

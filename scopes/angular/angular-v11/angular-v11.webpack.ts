import { DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { getCompilerConfig } from '@angular-devkit/build-angular/src/browser';
import { Schema as BrowserBuilderSchema, OutputHashing } from '@angular-devkit/build-angular/src/browser/schema';
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
import { AngularWebpack, WebpackSetup } from '@teambit/angular';
import { Workspace } from '@teambit/workspace';
import { CompositionsMain } from '@teambit/compositions';
import { webpack4ServeConfigFactory } from './webpack/webpack4.serve.config';
import { webpack4BuildConfigFactory } from './webpack/webpack4.build.config';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { VariantPolicyConfigObject } from '@teambit/dependency-resolver';
import { Logger } from '@teambit/logger';
import { WebpackConfigWithDevServer, WebpackMain } from '@teambit/webpack';
import { ngPackagr } from 'ng-packagr';
import path from 'path';
import webpack, { Configuration } from 'webpack';
import WsDevServer, { addDevServerEntrypoints } from 'webpack-dev-server';
import { AngularV11Aspect } from './angular-v11.aspect';

export class AngularV11Webpack extends AngularWebpack {
  webpackDevServer = WsDevServer;
  webpackServeConfigFactory = webpack4ServeConfigFactory;
  webpackBuildConfigFactory = webpack4BuildConfigFactory;
  webpack: typeof webpack;

  constructor(workspace: Workspace, webpackMain: WebpackMain, compositions: CompositionsMain) {
    super(workspace, webpackMain, compositions, AngularV11Aspect);
    // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
    // otherwise, if we use a different version, it would break
    const buildAngular = require.resolve('@angular-devkit/build-angular');
    const webpackPath = require.resolve('webpack', {paths: [buildAngular]});
    this.webpack = require(webpackPath);
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

  async getWebpackConfig(context: DevServerContext | BundlerContext, entryFiles: string[], tsconfigPath: string, workspaceRoot: string, logger: Logger, setup: WebpackSetup, extraOptions: Partial<WebpackConfigWithDevServer> = {}): Promise<WebpackConfigWithDevServer | Configuration> {
    // Options from angular.json
    const browserOptions: BrowserBuilderSchema = {
      baseHref: './',
      preserveSymlinks: true,
      outputPath: 'public', // doesn't matter because it will be deleted from the config
      index: "src/index.html",
      main: "src/main.ts",
      polyfills: "src/polyfills.ts",
      tsConfig: tsconfigPath,
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
      optimization: setup === WebpackSetup.Build,
      buildOptimizer: setup === WebpackSetup.Build,
      aot: true,
      deleteOutputPath: true,
      sourceMap: setup === WebpackSetup.Serve,
      outputHashing: setup === WebpackSetup.Build ? OutputHashing.All : OutputHashing.None,
      // inlineStyleLanguage: InlineStyleLanguage.Scss,
      watch: setup === WebpackSetup.Serve,
      // deployUrl: undefined,
      // subresourceIntegrity: undefined,
      // crossOrigin: undefined,
    };

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

    const webpackConfig: any = await generateWebpackConfig(
      getSystemPath(normalizedWorkspaceRoot),
      getSystemPath(projectRoot),
      getSystemPath(sourceRoot),
      normalizedOptions,
      (wco: BrowserWebpackConfigOptions) => [
        setup === WebpackSetup.Serve ? getDevServerConfig(wco) : {},
        getCommonConfig(wco),
        getBrowserConfig(wco),
        getStylesConfig(wco), // TODO
        getStatsConfig(wco),
        getCompilerConfig(wco),
      ],
      loggerApi,
      {}
    );

    // Add bit generated files to the list of entries
    webpackConfig.entry.bit = entryFiles;

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

    if (setup === WebpackSetup.Serve && browserOptions.index) {
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

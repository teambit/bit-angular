import { DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { OutputHashing } from '@angular-devkit/build-angular/src/server/schema';
import {
  BuildBrowserFeatures,
  normalizeBrowserSchema,
  normalizeOptimization,
} from '@angular-devkit/build-angular/src/utils';
import { generateEntryPoints } from '@angular-devkit/build-angular/src/utils/package-chunk-sort';
import {
  BrowserWebpackConfigOptions,
  generateWebpackConfig,
  getIndexOutputFile,
} from '@angular-devkit/build-angular/src/utils/webpack-browser-config';
import {
  getBrowserConfig,
  getCommonConfig,
  getDevServerConfig,
  getStatsConfig,
  getStylesConfig,
  getTypeScriptConfig,
} from '@angular-devkit/build-angular/src/webpack/configs';
import { IndexHtmlWebpackPlugin } from '@angular-devkit/build-angular/src/webpack/plugins/index-html-webpack-plugin';
import { getSystemPath, logging, normalize, tags } from '@angular-devkit/core';
import { WebpackSetup, AngularWebpack, optionValue } from '@teambit/angular';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Logger } from '@teambit/logger';
import { WebpackConfigWithDevServer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { PkgMain } from '@teambit/pkg';
import path from 'path';
import webpack, { Configuration } from 'webpack';
import WsDevServer from 'webpack-dev-server';
import { webpack5BuildConfigFactory } from './webpack/webpack5.build.config';
import { webpack5ServeConfigFactory } from './webpack/webpack5.serve.config';
import { AngularV12Aspect } from './angular-v12.aspect';
import { ApplicationMain } from '@teambit/application';

export class AngularV12Webpack extends AngularWebpack {
  enableIvy = true;
  webpackDevServer = WsDevServer;
  webpackServeConfigFactory = webpack5ServeConfigFactory;
  webpackBuildConfigFactory = webpack5BuildConfigFactory;
  webpack: typeof webpack;

  constructor(workspace: Workspace | undefined, webpackMain: WebpackMain, pkg: PkgMain, application: ApplicationMain) {
    super(workspace, webpackMain, pkg, application, AngularV12Aspect);
    // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
    // otherwise, if we use a different version, it would break
    const buildAngular = require.resolve('@angular-devkit/build-angular');
    const webpackPath = require.resolve('webpack', { paths: [buildAngular] });
    this.webpack = require(webpackPath);
  }

  /**
   * Migrate options from webpack-dev-server 3 to 4
   */
  private migrateConfiguration(webpackConfig: any): Configuration {
    /**
     * Removed logLevel in favor of built-in logger
     * see https://webpack.js.org/configuration/other-options/#infrastructurelogginglevel
     */
    delete webpackConfig.devServer.logLevel;

    // Removed contentBase in favor of the static option
    delete webpackConfig.devServer.contentBase;

    // Removed publicPath in favor of the dev option
    delete webpackConfig.devServer.publicPath;

    // Moved overlay to client option
    webpackConfig.devServer.client = webpackConfig.devServer.client || {};
    webpackConfig.devServer.client.overlay = webpackConfig.devServer.overlay;
    delete webpackConfig.devServer.overlay;

    // Removed in favor of the static option
    delete webpackConfig.devServer.watchOptions;

    // Moved sockPath to client.webSocketURL.pathname option
    // We let webpack handle that now
    delete webpackConfig.devServer.sockPath;

    // Removed stats in favor of the stats options from webpack
    delete webpackConfig.devServer.stats;

    // Removed in favor client.webSocketURL options
    delete webpackConfig.devServer.public;

    // Removed watch to avoid "DEP_WEBPACK_WATCH_WITHOUT_CALLBACK" warning
    delete webpackConfig.watch;

    // Removed in favor of manual setup entries.
    delete webpackConfig.devServer.injectClient;

    // Cleaning up undefined values
    Object.keys(webpackConfig.devServer).forEach((option) => {
      if (typeof webpackConfig.devServer[option] === 'undefined') {
        delete webpackConfig.devServer[option];
      }
    });

    return webpackConfig;
  }

  async getWebpackConfig(
    _context: DevServerContext | BundlerContext,
    entryFiles: string[],
    tsconfigPath: string,
    workspaceRoot: string,
    logger: Logger,
    setup: WebpackSetup,
    webpackOptions: Partial<WebpackConfigWithDevServer | Configuration> = {},
    angularOptions: Partial<BrowserBuilderSchema> = {}
  ): Promise<WebpackConfigWithDevServer | Configuration> {
    // Options from angular.json
    const browserOptions: BrowserBuilderSchema = {
      ...angularOptions,
      baseHref: './',
      preserveSymlinks: false,
      outputPath: 'public', // doesn't matter because it will be deleted from the config
      index: 'src/index.html',
      main: 'src/main.ts',
      polyfills: 'src/polyfills.ts',
      tsConfig: tsconfigPath,
      assets: ['src/favicon.ico', 'src/assets', ...(angularOptions.assets || [])],
      styles: ['src/styles.scss', ...(angularOptions.styles || [])],
      scripts: angularOptions.scripts,
      vendorChunk: optionValue(angularOptions.vendorChunk, true),
      namedChunks: optionValue(angularOptions.namedChunks, true),
      optimization: optionValue(angularOptions.optimization, setup === WebpackSetup.Build),
      buildOptimizer: optionValue(angularOptions.buildOptimizer, setup === WebpackSetup.Build),
      aot: optionValue(angularOptions.aot, true),
      deleteOutputPath: optionValue(angularOptions.deleteOutputPath, true),
      sourceMap: optionValue(angularOptions.sourceMap, true),
      outputHashing: optionValue(angularOptions.outputHashing, setup === WebpackSetup.Build ? OutputHashing.All : OutputHashing.None),
      watch: setup === WebpackSetup.Serve,
      allowedCommonJsDependencies: ['@teambit/harmony', 'graphql', '@teambit/documenter.ng.content.copy-box', ...(angularOptions.allowedCommonJsDependencies || [])],
    };
    const normalizedWorkspaceRoot = normalize(workspaceRoot);
    const projectRoot = normalize('');
    const sourceRoot = normalize('src');

    const normalizedOptions = normalizeBrowserSchema(normalizedWorkspaceRoot, projectRoot, sourceRoot, {
      ...browserOptions,
      ...(webpackOptions as Partial<BrowserBuilderSchema & DevServerBuilderOptions>),
    });

    const loggerApi = {
      createChild: () => logger as any,
      ...logger,
      log: logger.console,
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
        getStylesConfig(wco),
        getStatsConfig(wco),
        getTypeScriptConfig(wco),
      ],
      loggerApi,
      {}
    );

    // @ts-ignore
    if (webpackOptions.hmr) {
      logger.warn(tags.stripIndents`NOTICE: Hot Module Replacement (HMR) is enabled for the dev server.
      See https://webpack.js.org/guides/hot-module-replacement for information on working with HMR for Webpack.`);
    }

    // Add bit generated files to the list of entries
    webpackConfig.entry.main.unshift(...entryFiles);

    // if (setup === WebpackSetup.Serve && browserOptions.index) {
    const { scripts = [], styles = [] } = browserOptions;
    // const { options: compilerOptions } = readTsconfig(browserOptions.tsConfig, workspaceRoot);
    // const target = compilerOptions.target || ts.ScriptTarget.ES5;
    const buildBrowserFeatures = new BuildBrowserFeatures(workspaceRoot);
    const entrypoints = generateEntryPoints({ scripts, styles });
    // const moduleEntrypoints = buildBrowserFeatures.isDifferentialLoadingNeeded(target)
    //   ? generateEntryPoints({ scripts: [], styles })
    //   : [];
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
        lang: 'en-US', // TODO(ocombe) support locale
      })
    );

    // don't use the output path from angular
    delete webpackConfig?.output?.path;
    delete webpackConfig?.resolve?.modules;
    webpackConfig.stats = 'errors-only';

    if (setup === WebpackSetup.Serve) {
      return this.migrateConfiguration(webpackConfig);
    }

    return webpackConfig;
  }
}

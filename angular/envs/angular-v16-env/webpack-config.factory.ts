/* eslint-disable no-param-reassign */
import type { BrowserBuilderOptions, DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { OutputHashing } from '@angular-devkit/build-angular';
import {
  getCommonConfig,
  getDevServerConfig,
  getStylesConfig
} from '@angular-devkit/build-angular/src/tools/webpack/configs';
import {
  IndexHtmlWebpackPlugin
} from '@angular-devkit/build-angular/src/tools/webpack/plugins/index-html-webpack-plugin';
import {
  normalizeBrowserSchema,
  normalizeOptimization
} from '@angular-devkit/build-angular/src/utils';
import { normalizeCacheOptions } from '@angular-devkit/build-angular/src/utils/normalize-cache';
import { generateEntryPoints } from '@angular-devkit/build-angular/src/utils/package-chunk-sort';
import {
  BrowserWebpackConfigOptions,
  generateWebpackConfig,
  getIndexOutputFile
} from '@angular-devkit/build-angular/src/utils/webpack-browser-config';
import { getSystemPath, logging, normalize, tags } from '@angular-devkit/core';
import { BundlerSetup } from '@bitdev/angular.dev-services.common';
import {
  WebpackBuildConfigFactoryOpts,
  WebpackConfig,
  WebpackConfigFactoryOpts,
  WebpackServeConfigFactoryOpts
} from '@bitdev/angular.dev-services.webpack';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Logger } from '@teambit/logger';
import {
  runTransformersWithContext,
  WebpackConfigMutator,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer
} from '@teambit/webpack';
import path, { join } from 'path';
import type { Configuration } from 'webpack';
import { webpack5BuildConfigFactory } from './webpack/webpack5.build.config';
import { webpack5ServeConfigFactory } from './webpack/webpack5.serve.config';

/**
 * Migrate options from webpack-dev-server 3 to 4
 */
function migrateConfiguration(webpackConfig: any): WebpackConfigWithDevServer | Configuration {
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

  delete webpackConfig.devServer.devMiddleware.publicPath;
  delete webpackConfig.devServer.webSocketServer;
  delete webpackConfig.devServer.client;

  return webpackConfig;
}

async function getWebpackConfig(
  _context: DevServerContext | BundlerContext,
  entryFiles: string[],
  tsconfigPath: string,
  workspaceRoot: string,
  logger: Logger,
  setup: BundlerSetup,
  webpackOptions: Partial<WebpackConfigWithDevServer | WebpackConfig> = {},
  angularOptions: Partial<BrowserBuilderOptions> = {},
  sourceRoot = 'src'
): Promise<WebpackConfigWithDevServer | WebpackConfig> {
  // Options from angular.json
  const browserOptions: BrowserBuilderOptions = {
    ...angularOptions,
    baseHref: angularOptions.baseHref ?? './',
    preserveSymlinks: false,
    outputPath: 'public', // doesn't matter because it will be deleted from the config
    index: angularOptions.index ?? `./${join(sourceRoot, `index.html`)}`,
    main: angularOptions.main ?? `./${join(sourceRoot, `main.ts`)}`,
    polyfills: angularOptions.polyfills ?? `./${join(sourceRoot, `polyfills.ts`)}`,
    tsConfig: angularOptions.tsConfig ?? tsconfigPath,
    assets: [...new Set([path.posix.join(sourceRoot, `assets/**/*`), ...(angularOptions.assets ?? [])])], // using set to remove duplicates
    styles: [...new Set([path.posix.join(sourceRoot, `styles.scss`), ...(angularOptions.styles ?? [])])], // using set to remove duplicates
    scripts: angularOptions.scripts,
    vendorChunk: angularOptions.vendorChunk ?? true,
    namedChunks: angularOptions.namedChunks ?? true,
    optimization: angularOptions.optimization ?? setup === BundlerSetup.Build,
    buildOptimizer: angularOptions.buildOptimizer ?? setup === BundlerSetup.Build,
    aot: angularOptions.aot ?? true,
    deleteOutputPath: angularOptions.deleteOutputPath ?? true,
    sourceMap: angularOptions.sourceMap ?? true,
    outputHashing: angularOptions.outputHashing ?? (setup === BundlerSetup.Build ? OutputHashing.All : OutputHashing.None),
    watch: setup === BundlerSetup.Serve,
    allowedCommonJsDependencies: ['dompurify', '@teambit/harmony', 'graphql', '@teambit/documenter.ng.content.copy-box', ...(angularOptions.allowedCommonJsDependencies || [])]
  };
  const normalizedWorkspaceRoot = normalize(workspaceRoot);
  // used to load component config files, such as tailwind config, ...
  const projectRoot = normalize(workspaceRoot);
  const normalizedSourceRoot = normalize(sourceRoot);
  const loggerApi = {
    createChild: () => logger as any,
    ...logger,
    log: logger.console
  } as any as logging.LoggerApi;

  const normalizedOptions = normalizeBrowserSchema(
    normalizedWorkspaceRoot,
    projectRoot,
    normalizedSourceRoot,
    {
      ...browserOptions,
      ...(webpackOptions as Partial<BrowserBuilderOptions & DevServerBuilderOptions>)
    },
    {
      cli: {
        cache: {
          // disable webpack cache for now because it seems to cause an infinite loop
          // TODO(ocombe): investigate this, maybe change the path?
          enabled: false
        }
      }
    },
    loggerApi
  );

  let webpackConfig: any = await generateWebpackConfig(
    getSystemPath(normalizedWorkspaceRoot),
    getSystemPath(projectRoot),
    getSystemPath(normalizedSourceRoot),
    'bit-angular-v16-env', // projectName
    normalizedOptions,
    (wco: BrowserWebpackConfigOptions) => [
      setup === BundlerSetup.Serve ? getDevServerConfig(wco) : {},
      getCommonConfig(wco),
      getStylesConfig(wco)
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
  // webpackConfig.entry.main = entryFiles;

  const { scripts = [], styles = [] } = browserOptions;
  const entrypoints = generateEntryPoints({ scripts, styles });
  const normalizedIndex = normalize(browserOptions.index as string);
  const normalizedOptimization = normalizeOptimization(browserOptions.optimization);
  if (!webpackConfig.plugins) {
    webpackConfig.plugins = [];
  }
  const cacheOptions = normalizeCacheOptions({}, workspaceRoot);
  webpackConfig.plugins.push(
    new IndexHtmlWebpackPlugin({
      indexPath: path.resolve(workspaceRoot, browserOptions.index as string),
      outputPath: getIndexOutputFile(normalizedIndex),
      baseHref: browserOptions.baseHref || '/',
      entrypoints,
      deployUrl: browserOptions.deployUrl,
      sri: browserOptions.subresourceIntegrity,
      cache: cacheOptions,
      postTransform: undefined, // IndexHtmlTransform
      optimization: normalizedOptimization,
      crossOrigin: browserOptions.crossOrigin,
      lang: 'en-US' // TODO(ocombe) support locale
    })
  );

  // don't use the output path from angular
  delete webpackConfig?.output?.path;
  delete webpackConfig?.resolve?.modules;
  webpackConfig.stats = 'errors-only';
  // uniqueName should not be an empty string
  webpackConfig.output.uniqueName = 'angular-v16-env';

  if (setup === BundlerSetup.Serve) {
    webpackConfig = migrateConfiguration(webpackConfig);
  }

  return webpackConfig;
}

export async function webpackConfigFactory(opts: WebpackConfigFactoryOpts & WebpackServeConfigFactoryOpts & WebpackBuildConfigFactoryOpts): Promise<WebpackConfigWithDevServer> {
  const baseConfig = await getWebpackConfig(
    opts.context,
    opts.entryFiles,
    opts.tsConfigPath,
    opts.rootPath,
    opts.logger,
    opts.setup,
    opts.webpackOptions,
    opts.angularOptions,
    opts.sourceRoot
  ) as WebpackConfigWithDevServer;

  let overwriteConfig: WebpackConfigWithDevServer;
  if (opts.setup === BundlerSetup.Serve) {
    overwriteConfig = webpack5ServeConfigFactory(
      opts.devServerID,
      opts.workspaceDir,
      opts.entryFiles,
      opts.publicRoot,
      opts.publicPath,
      opts.pubsub,
      opts.nodeModulesPaths,
      opts.tempFolder,
      opts.plugins,
      opts.isApp,
      opts.useNgcc
    );
  } else {
    overwriteConfig = webpack5BuildConfigFactory(
      opts.entryFiles,
      opts.outputPath,
      opts.nodeModulesPaths,
      opts.workspaceDir,
      opts.tempFolder,
      opts.plugins,
      opts.useNgcc
    ) as WebpackConfigWithDevServer;
  }

  const transformer: WebpackConfigTransformer = configMutator => configMutator.merge([baseConfig]);
  const configMutator = new WebpackConfigMutator(overwriteConfig);
  const afterMutation = runTransformersWithContext(
    configMutator.clone(),
    [transformer],
    { mode: 'dev' }
  );
  return afterMutation.raw as WebpackConfigWithDevServer;
}

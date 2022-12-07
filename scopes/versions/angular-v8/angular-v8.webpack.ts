import { BuilderContext } from '@angular-devkit/architect';
import type { BrowserBuilderOptions, DevServerBuilderOptions } from '@angular-devkit/build-angular';
import {
  getBrowserConfig,
  getCommonConfig,
  getStatsConfig,
  getStylesConfig,
  getAotConfig,
  getNonAotConfig
} from '@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs';
import {
  WebpackConfigOptions
} from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import {
  OutputHashing,
  Schema as BrowserBuilderSchema
} from '@angular-devkit/build-angular/src/browser/schema';
import { buildServerConfig } from '@angular-devkit/build-angular/src/dev-server';
import { normalizeBrowserSchema, NormalizedBrowserBuilderSchema } from '@angular-devkit/build-angular/src/utils';
import { generateEntryPoints } from '@angular-devkit/build-angular/src/angular-cli-files/utilities/package-chunk-sort';
import {
  generateWebpackConfig,
  getIndexOutputFile
} from '@angular-devkit/build-angular/src/utils/webpack-browser-config';
import { IndexHtmlWebpackPlugin } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import { getSystemPath, logging, normalize, tags } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import {
  AngularBaseWebpack,
  AngularEnvOptions,
  WebpackConfig,
  WebpackSetup
} from '@teambit/angular-base';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Logger } from '@teambit/logger';
import { WebpackConfigWithDevServer, WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { PkgMain } from '@teambit/pkg';
import path, { join } from 'path';
import webpack  from 'webpack';
import WsDevServer, { addDevServerEntrypoints } from 'webpack-dev-server';
import { AngularV8Aspect } from './angular-v8.aspect';
import { webpack4BuildConfigFactory } from './webpack/webpack4.build.config';
import { webpack4ServeConfigFactory } from './webpack/webpack4.serve.config';
import { ApplicationMain } from '@teambit/application';

function getCompilerConfig(wco: WebpackConfigOptions): WebpackConfig {
  if (wco.buildOptions.main || wco.buildOptions.polyfills) {
    return wco.buildOptions.aot ? getAotConfig(wco) : getNonAotConfig(wco);
  }

  return {};
}

type BrowserWebpackConfigOptions = WebpackConfigOptions<NormalizedBrowserBuilderSchema>;

export class AngularV8Webpack extends AngularBaseWebpack {
  enableIvy = false;
  webpackDevServer = WsDevServer;
  webpackServeConfigFactory = webpack4ServeConfigFactory;
  webpackBuildConfigFactory = webpack4BuildConfigFactory;
  webpack: typeof webpack;

  constructor(workspace: Workspace | undefined, webpackMain: WebpackMain, pkg: PkgMain, application: ApplicationMain, ngEnvOptions: AngularEnvOptions) {
    super(workspace, webpackMain, pkg, application, AngularV8Aspect, ngEnvOptions);
    // resolving to the webpack used by angular devkit to avoid multiple instances of webpack
    // otherwise, if we use a different version, it would break
    const buildAngular = require.resolve('@angular-devkit/build-angular');
    const webpackPath = require.resolve('webpack', { paths: [buildAngular] });
    this.webpack = require(webpackPath);
  }

  /**
   * Migrate options from webpack-dev-server 3 to 4
   */
  private migrateConfiguration(webpackConfig: WebpackConfig): WebpackConfigWithDevServer | WebpackConfig {
    /**
     * Removed contentBase in favor of the static option
     */
    // @ts-ignore
    delete webpackConfig.devServer.contentBase;

    return webpackConfig;
  }

  async getWebpackConfig(
    context: DevServerContext | BundlerContext,
    entryFiles: string[],
    tsconfigPath: string,
    workspaceRoot: string,
    logger: Logger,
    setup: WebpackSetup,
    webpackOptions: Partial<WebpackConfigWithDevServer | WebpackConfig> = {},
    angularOptions: Partial<BrowserBuilderOptions> = {},
    sourceRoot = 'src',
  ): Promise<WebpackConfigWithDevServer | WebpackConfig> {
    // Options from angular.json
    const browserOptions: BrowserBuilderOptions = {
      ...angularOptions,
      baseHref: path.posix.join('/', context.rootPath!, context.publicPath!),
      preserveSymlinks: false,
      outputPath: 'public', // doesn't matter because it will be deleted from the config
      index: angularOptions.index ?? join(sourceRoot, `index.html`),
      main: angularOptions.main ?? join(sourceRoot, `main.ts`),
      polyfills: angularOptions.polyfills ?? join(sourceRoot, `polyfills.ts`),
      tsConfig: angularOptions.tsConfig ?? tsconfigPath,
      assets: [...new Set([path.posix.join(sourceRoot, `favicon.ico`), path.posix.join(sourceRoot, `assets`), ...(angularOptions.assets ?? [])])], // using set to remove duplicates
      styles: [...new Set([path.posix.join(sourceRoot, `styles.scss`), ...(angularOptions.styles ?? [])])], // using set to remove duplicates
      scripts: angularOptions.scripts,
      vendorChunk: angularOptions.vendorChunk ?? true,
      namedChunks: angularOptions.namedChunks ?? true,
      optimization: angularOptions.optimization ?? setup === WebpackSetup.Build,
      buildOptimizer: angularOptions.buildOptimizer ?? setup === WebpackSetup.Build,
      aot: angularOptions.aot ?? setup === WebpackSetup.Build,
      deleteOutputPath: angularOptions.deleteOutputPath ?? true,
      sourceMap: angularOptions.sourceMap ?? true,
      outputHashing: angularOptions.outputHashing ?? (setup === WebpackSetup.Build ? OutputHashing.All : OutputHashing.None),
      watch: setup === WebpackSetup.Serve
    };

    const normalizedWorkspaceRoot = normalize(workspaceRoot);
    const projectRoot = normalizedWorkspaceRoot;
    const normalizedSourceRoot = normalize(sourceRoot);

    const host = new NodeJsSyncHost();
    const normalizedOptions = normalizeBrowserSchema(host, normalizedWorkspaceRoot, projectRoot, normalizedSourceRoot, {
      ...browserOptions,
      ...(webpackOptions as Partial<BrowserBuilderSchema & DevServerBuilderOptions>),
    });

    const loggerApi = {
      createChild: () => logger as any,
      ...logger,
      log: logger.console,
    } as any as logging.LoggerApi;

    const webpackConfigArr: any[] = await generateWebpackConfig(
      {builder: {
        builderName: 'browser'
      }} as BuilderContext,
      getSystemPath(normalizedWorkspaceRoot),
      getSystemPath(projectRoot),
      getSystemPath(normalizedSourceRoot),
      normalizedOptions,
      (wco: BrowserWebpackConfigOptions) => [
        getCommonConfig(wco),
        getBrowserConfig(wco),
        getStylesConfig(wco),
        getStatsConfig(wco),
        getCompilerConfig(wco),
      ],
      loggerApi
    );

    const webpackConfig = webpackConfigArr[0];

    if(setup === WebpackSetup.Serve) {
      webpackConfig.devServer = buildServerConfig(
        normalizedWorkspaceRoot,
        webpackOptions as DevServerBuilderOptions,
        browserOptions,
        loggerApi
      );
    }

    // Add bit generated files to the list of entries
    webpackConfig.entry.main.unshift(...entryFiles);

    // @ts-ignore
    if (webpackOptions.liveReload && !webpackOptions.hmr) {
      // This is needed because we cannot use the inline option directly in the config
      // because of the SuppressExtractedTextChunksWebpackPlugin
      // Consider not using SuppressExtractedTextChunksWebpackPlugin when liveReload is enable.
      // tslint:disable-next-line: no-any
      addDevServerEntrypoints(webpackConfig as any, {
        ...(webpackConfig as any).devServer,
        inline: true,
      });

      // Remove live-reload code from all entrypoints but not main.
      // Otherwise this will break SuppressExtractedTextChunksWebpackPlugin because
      // 'addDevServerEntrypoints' adds additional entry-points to all entries.
      if (
        webpackConfig.entry &&
        typeof webpackConfig.entry === 'object' &&
        !Array.isArray(webpackConfig.entry) &&
        webpackConfig.entry.main
      ) {
        for (const [key, value] of Object.entries(webpackConfig.entry)) {
          if (key === 'main' || !Array.isArray(value)) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const webpackClientScriptIndex = value.findIndex((x) => x.includes('webpack-dev-server/client/index.js'));
          if (webpackClientScriptIndex >= 0) {
            // Remove the webpack-dev-server/client script from array.
            value.splice(webpackClientScriptIndex, 1);
          }
        }
      }
    }

    // @ts-ignore
    if (webpackOptions.hmr) {
      logger.warn(tags.stripIndents`NOTICE: Hot Module Replacement (HMR) is enabled for the dev server.
      See https://webpack.js.org/guides/hot-module-replacement for information on working with HMR for Webpack.`);
    }

    const { scripts = [], styles = [] } = browserOptions;
    const entrypoints = generateEntryPoints({ scripts, styles });
    if (!webpackConfig.plugins) {
      webpackConfig.plugins = [];
    }
    webpackConfig.plugins.push(
      new IndexHtmlWebpackPlugin({
        input: path.resolve(workspaceRoot, browserOptions.index as string),
        output: getIndexOutputFile(browserOptions),
        baseHref: browserOptions.baseHref || '/',
        entrypoints,
        moduleEntrypoints: [],
        noModuleEntrypoints: ['polyfills-es5'],
        deployUrl: browserOptions.deployUrl,
        sri: browserOptions.subresourceIntegrity,
        crossOrigin: browserOptions.crossOrigin,
      })
    );

    // don't use the output path from angular
    delete webpackConfig?.output?.path;
    delete webpackConfig?.resolve?.modules;
    webpackConfig.stats = 'errors-only';
    // webpackConfig.context = workspaceRoot;

    if (setup === WebpackSetup.Serve) {
      return this.migrateConfiguration(webpackConfig);
    }


    return webpackConfig;
  }
}

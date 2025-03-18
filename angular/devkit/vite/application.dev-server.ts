/* eslint-disable no-param-reassign */
import { executeDevServerBuilder, OutputHashing } from '@angular-devkit/build-angular';
import { VERSION } from '@angular/cli';
import {
  ApplicationInternalOptions,
  dedupePaths,
  getLoggerApi,
  normalizePath
} from '@bitdev/angular.dev-services.common';
import { type ApplicationBuilderOptions, type DevServerBuilderOptions, } from '@bitdev/angular.dev-services.ng-compat';
import { Logger } from '@teambit/logger';
import assert from 'assert';
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';
import { createEvent } from 'h3';
// @ts-ignore
import type { NitroConfig } from 'nitropack';
import { join, posix, relative, resolve } from 'path';
// @ts-ignore
import type { Connect } from 'vite';
import dedupePlugin from "./plugins/dedupe.plugin.js";
import definePlugin from './plugins/define.plugin.js';
import mdPlugin from "./plugins/md.plugin.js";

export type ServeApplicationOptions = {
  angularOptions: Partial<ApplicationInternalOptions & DevServerBuilderOptions>;
  sourceRoot: string;
  workspaceRoot: string;
  logger: Logger;
  port: number;
  tempFolder: string;
  envVars: any;
  indexHtmlTransform?: (content: string) => Promise<string>;
  isPreview?: boolean;
}

// TODO allow customizing this
const API_ROUTE = '/api';
const OUTPUT_PATH = 'dist';
const BUILDER_NAME = '@angular-devkit/build-angular:application';
const CACHE_PATH = 'angular/cache';

export async function serveApplication(options: ServeApplicationOptions): Promise<void> {
  // intercept SIGINT and exit cleanly, otherwise the process will not exit properly on Ctrl+C
  process.on('SIGINT', () => process.exit(1));

  const { angularOptions: { server, tsConfig, define }, envVars } = options;
  assert(tsConfig, 'tsConfig option is required');
  const isSsr = !!server && Number(VERSION.major) >= 17;
  const appOptions = getAppOptions(options, isSsr);
  const builderContext = getBuilderContext(options, appOptions);
  const devServerOptions: any = {
    buildPlugins: [dedupePlugin()],
    middleware: []
  };
  if (options.isPreview) {
    devServerOptions.buildPlugins.push(mdPlugin(), nodeModulesPolyfillPlugin());
  }
  if (isSsr) {
    devServerOptions.buildPlugins.push(definePlugin({ ...envVars, ...define }));

    // Versions of Angular <19 require a nitro middleware to support SSR API endpoints
    if (Number(VERSION.major) < 19) {
      devServerOptions.middleware = [await createNitroApiMiddleware(options)];
    }
  }
  const transforms = {
    indexHtml: options.indexHtmlTransform
  };

  if (Number(VERSION.major) > 17 || (Number(VERSION.major) == 17 && Number(VERSION.minor) >= 1)) {
    // @ts-ignore only v17.1.0+ has 4 arguments, previous versions only have 3
    await executeDevServerBuilder(appOptions, builderContext as any, transforms, devServerOptions).toPromise();
  } else {
    // @ts-ignore only v17.1.0+ has 4 arguments, previous versions only have 3
    await executeDevServerBuilder(appOptions, builderContext as any, devServerOptions).toPromise();
  }
}

function getAppOptions(options: ServeApplicationOptions, isSsr: boolean): /*ApplicationBuilderOptions & DevServerBuilderOptions*/ any {
  const { angularOptions, port, sourceRoot, workspaceRoot } = options;
  // declare constants for all reusable values here
  const normalizedIndex = `./${join(sourceRoot, 'index.html')}`;
  const normalizedBrowser = `./${join(sourceRoot, 'main.ts')}`;
  const serverPath = `./${join(sourceRoot, 'main.server.ts')}`;

  const dedupedAssets = dedupePaths([posix.join(sourceRoot, `assets/**/*`), ...(angularOptions.assets ?? [])]);
  const dedupedStyles = dedupePaths([posix.join(sourceRoot, `styles.${angularOptions.inlineStyleLanguage}`), ...(angularOptions.styles ?? [])]);

  return {
    ...angularOptions,
    baseHref: angularOptions.baseHref ?? '/',
    preserveSymlinks: false,
    outputPath: OUTPUT_PATH,
    index: angularOptions.index ?? normalizedIndex,
    browser: angularOptions.browser ?? (angularOptions.entryPoints ? undefined : normalizedBrowser),
    tsConfig: relative(workspaceRoot, angularOptions.tsConfig!),
    assets: dedupedAssets,
    styles: dedupedStyles,
    scripts: angularOptions.scripts,
    namedChunks: angularOptions.namedChunks ?? true,
    optimization: angularOptions.optimization ?? true,
    aot: true,
    deleteOutputPath: true,
    sourceMap: angularOptions.sourceMap ?? true,
    outputHashing: angularOptions.outputHashing ?? OutputHashing.All,
    watch: true,
    liveReload: angularOptions.liveReload ?? true,
    hmr: angularOptions.hmr ?? false,
    outputMode: angularOptions.outputMode ?? (isSsr ? 'server' : 'static'),
    server: isSsr ? angularOptions.server ?? serverPath : undefined,
    prerender: isSsr && !angularOptions.outputMode ? angularOptions.prerender ?? !!angularOptions.server : undefined,
    partialSSRBuild: isSsr ? angularOptions.partialSSRBuild ?? true : undefined,
    ssr: isSsr ? (angularOptions.ssr ?? !!angularOptions.server) : false,
    port,
    // @ts-ignore Angular 17-18
    browserTarget: BUILDER_NAME,
    // @ts-ignore Angular 17+
    buildTarget: BUILDER_NAME,
    // support for bit.cloud workspaces
    host: "0.0.0.0"
  };
}

function getBuilderContext(options: ServeApplicationOptions, appOptions: ApplicationBuilderOptions & DevServerBuilderOptions) {
  const { workspaceRoot } = options;
  const builderAbort = new AbortController();
  return {
    id: 1,
    builder: {
      builderName: BUILDER_NAME,
      description: 'Bit Angular Application Builder',
      optionSchema: {}
    },
    logger: getLoggerApi(options.logger, !options.isPreview),
    signal: builderAbort.signal,
    workspaceRoot: workspaceRoot,
    currentDirectory: '',
    // doesn't matter, just needs to exist
    target: {
      project: 'bit-ng-app-builder',
      target: 'development'
    },
    getProjectMetadata: getProjectMetadata(options),
    addTeardown: () => {
    },
    getBuilderNameForTarget: () => Promise.resolve(BUILDER_NAME),
    getTargetOptions: () => Promise.resolve(appOptions as any),
    validateOptions: () => Promise.resolve(appOptions as any)
  };
}

function getProjectMetadata(options: ServeApplicationOptions) {
  const { sourceRoot, tempFolder } = options;
  return function (): Promise<any> {
    return Promise.resolve({
      root: '',
      sourceRoot,
      cli: {
        cache: {
          enabled: true,
          path: resolve(tempFolder, CACHE_PATH)
        }
      }
    });
  };
}

function getNitroConfig(options: ServeApplicationOptions): NitroConfig {
  const { workspaceRoot, tempFolder } = options;
  const rootDir = workspaceRoot;
  return {
    rootDir,
    logLevel: 2,
    srcDir: normalizePath(`${rootDir}/src/server`),
    scanDirs: [normalizePath(`${rootDir}/src/server`)],
    buildDir: resolve(tempFolder, 'nitro')
  };
}

async function createNitroApiMiddleware(options: ServeApplicationOptions): Promise<Connect.NextHandleFunction> {
  const nitroConfig = getNitroConfig(options);

  // @ts-ignore
  const { createNitro, createDevServer, build } = await import('nitropack');

  const nitro = await createNitro({
    dev: true,
    ...nitroConfig
  });

  const server = createDevServer(nitro);
  await build(nitro);

  return async (
    req: any,
    res: any,
    next: any
  ) => {
    if (req.originalUrl.startsWith(API_ROUTE)) {
      await server.app.handler(createEvent(req, res));
      return;
    }
    next();
  };
}

/* eslint-disable no-param-reassign */
import { OutputHashing } from '@angular-devkit/build-angular';
import { VERSION } from '@angular/cli';
import { ApplicationOptions, dedupePaths, getLoggerApi, normalizePath } from '@bitdev/angular.dev-services.common';
import { type ApplicationBuilderOptions, buildApplicationInternal } from '@bitdev/angular.dev-services.ng-compat';
import { Logger } from '@teambit/logger';
import assert from 'assert';
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';
import fs from 'fs-extra';
// @ts-ignore
import type { NitroConfig } from 'nitropack';
import { fileURLToPath } from 'node:url';
import { basename, extname, join, posix, relative, resolve } from 'path';
import dedupePlugin from "./plugins/dedupe.plugin.js";
import definePlugin from './plugins/define.plugin.js';
import mdPlugin from "./plugins/md.plugin.js";
import { getIndexInputFile } from './utils/utils.js';

export type BuildApplicationOptions = {
  angularOptions: Partial<ApplicationOptions>;
  outputPath: string;
  sourceRoot: string;
  workspaceRoot: string;
  logger: Logger;
  tempFolder: string;
  entryServer?: string;
  envVars?: any;
  isPreview?: boolean;
  fastReturn?: boolean;
  consoleLogs?: boolean;
}

export type BuildOutput = {
  success: boolean;
  error?: string;
}

// TODO allow customizing this
const BUILDER_NAME = '@angular-devkit/build-angular:application';
const CACHE_PATH = 'angular/cache';

export async function buildApplication(options: BuildApplicationOptions): Promise<BuildOutput[] | AsyncIterable<any>> {
  const { angularOptions: { tsConfig, server, define }, envVars, isPreview, fastReturn } = options;
  assert(tsConfig, 'tsConfig option is required');
  const isSsr = !!server && Number(VERSION.major) >= 17;
  if (isSsr && Number(VERSION.major) < 19) {
    addEntryServer(options);
  }
  const appOptions = getAppOptions(options, isSsr);
  const builderContext = getBuilderContext(options, appOptions);
  const extensions: any = { codePlugins: [dedupePlugin()] };
  if (isPreview) {
    extensions.codePlugins.push(mdPlugin(), nodeModulesPolyfillPlugin());
  } else if ((Number(VERSION.major) >= 17 && Number(VERSION.minor) >= 1)) {
    extensions.codePlugins.push(definePlugin({ ...envVars, ...define || {} }));
  }

  let results: AsyncGenerator<BuildOutput>;
  // todo use buildApplication
  if (Number(VERSION.major) >= 18) {
    results = buildApplicationInternal(
      appOptions,
      builderContext,
      extensions
    )
  } else {
    results = buildApplicationInternal(
      appOptions,
      builderContext,
      { write: true },
      // @ts-ignore only v18+ has 3 arguments, previous versions had 4
      extensions
    )
  }

  const res: BuildOutput[] = [];
  if (fastReturn) {
    return results;
  }
  for await (const result of results) {
    res.push(result);
    if (result.error) {
      options.logger.error(result.error);
    }
  }

  // Versions of Angular <19 require a nitro middleware to support SSR API endpoints
  if (isSsr && Number(VERSION.major) < 19) {
    await buildNitro(options);
  }

  return res;
}

function addEntryServer(options: BuildApplicationOptions): void {
  const { entryServer, angularOptions: { ssr, server } } = options;
  if (ssr && entryServer) {
    const fileContent = `import type { ApplicationRef } from '@angular/core';
import { renderApplication, renderModule } from '@angular/platform-server';
import bootstrap from '${server?.replace(extname(server), '')}';

function isBootstrapFn(value: unknown): value is () => Promise<ApplicationRef> {
  // We can differentiate between a module and a bootstrap function by reading compiler-generated "ɵmod" static property:
  return typeof value === 'function' && !('ɵmod' in value);
}

export default async function render(url: string, document: string) {
  let html: string;
  if (isBootstrapFn(bootstrap)) {
    html = await renderApplication(bootstrap, {
      document,
      url
    });
  } else {
    html = await renderModule(bootstrap, {
      document,
      url
    });
  }

  return html;
}`;
    fs.outputFileSync(resolve(options.workspaceRoot, entryServer), fileContent);
  }
}

function getAppOptions(options: BuildApplicationOptions, isSsr: boolean): ApplicationBuilderOptions {
  const { entryServer, angularOptions, outputPath, sourceRoot, workspaceRoot } = options;

  // declare constants for all reusable values here
  const normalizedIndex = `./${join(sourceRoot, 'index.html')}`;
  const normalizedBrowser = `./${join(sourceRoot, 'main.ts')}`;
  const serverPath = `./${join(sourceRoot, 'main.server.ts')}`;

  const dedupedAssets = (angularOptions.assets as any) !== false ? dedupePaths([posix.join(sourceRoot, `assets/**/*`), ...(angularOptions.assets ?? [])]) : [];
  const dedupedStyles = (angularOptions.styles as any) !== false ? dedupePaths([posix.join(sourceRoot, `styles.${angularOptions.inlineStyleLanguage}`), ...(angularOptions.styles ?? [])]) : [];

  return {
    ...angularOptions,
    baseHref: angularOptions.baseHref ?? '/',
    preserveSymlinks: false,
    outputPath,
    index: angularOptions.index ?? normalizedIndex,
    browser: angularOptions.browser ?? normalizedBrowser,
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
    watch: angularOptions.watch ?? false,
    outputMode: angularOptions.outputMode ?? (isSsr ? 'server' : 'static'),
    server: isSsr ? angularOptions.server ?? serverPath : undefined,
    prerender: isSsr ? (angularOptions.prerender ?? !!angularOptions.server) : undefined,
    ssr: isSsr ? {
      entry: entryServer
    } : undefined,
    // @ts-ignore Angular 17-18
    browserTarget: BUILDER_NAME,
    // @ts-ignore Angular 17+
    buildTarget: BUILDER_NAME,
    // support for bit.cloud workspaces
    host: "0.0.0.0"
  };
}


function getBuilderContext(options: BuildApplicationOptions, appOptions: ApplicationBuilderOptions): any {
  const { workspaceRoot } = options;
  const builderAbort = new AbortController();
  return {
    id: 1,
    builder: {
      builderName: BUILDER_NAME,
      description: 'Bit Angular Application Builder',
      optionSchema: {}
    },
    logger: getLoggerApi(options.logger, options.consoleLogs),
    signal: builderAbort.signal,
    workspaceRoot: workspaceRoot,
    currentDirectory: '',
    // doesn't matter, just needs to exist
    target: {
      project: 'bit-ng-app-builder',
      // target: 'build'
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

function getProjectMetadata(options: BuildApplicationOptions) {
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

async function getNitroConfig(options: BuildApplicationOptions): Promise<NitroConfig> {
  const {
    workspaceRoot,
    tempFolder,
    outputPath,
    angularOptions: { ssr, index, prerender }
  } = options;

  const outputDir = normalizePath(join(workspaceRoot, outputPath));
  const browserDir = normalizePath(resolve(outputDir, 'browser'));
  const serverDir = normalizePath(resolve(outputDir, 'server'));
  const nitroDir = normalizePath(resolve(outputDir, 'ssr'));
  const indexPath = getIndexInputFile(index!);

  const prerenderedRoutes = prerender ? (await import(`${outputDir}/prerendered-routes.json`)).default : undefined;

  return {
    rootDir: workspaceRoot,
    logLevel: 1, // TODO reset this to 3 or 2 https://github.com/unjs/consola/#log-level
    srcDir: normalizePath(`${workspaceRoot}/src/server`),
    scanDirs: [normalizePath(`${workspaceRoot}/src/server`)],
    buildDir: resolve(tempFolder, 'nitro'),

    alias: ssr ? {
      '#alias/entry.server': normalizePath(join(serverDir, 'server.mjs')),
      '#alias/index': normalizePath(join(serverDir, `${basename(indexPath, extname(indexPath))}.server.html`))
    } : {},
    serverAssets: ssr ? [{
      baseName: 'public',
      dir: browserDir
    }] : [],
    publicAssets: ssr ? [{
      dir: browserDir
    }] : [],
    output: ssr ? {
      dir: nitroDir,
      publicDir: posix.join(nitroDir, 'public')
    } : {},
    externals: {
      external: [
        'rxjs',
        'node-fetch-native/dist/polyfill'
      ]
    },
    moduleSideEffects: [
      'zone.js/node',
      'zone.js/fesm2015/zone-node'
    ],
    // @ts-ignore
    renderer: ssr ? normalizePath(fileURLToPath(import.meta.resolve('./runtime/renderer.js'))) : undefined,
    // handlers: ssr ? [{
    //   handler: normalizePath(import.meta.resolve('./runtime/api-middleware')),
    //   middleware: true
    // }] : [],
    prerender: prerenderedRoutes,
    typescript: {
      generateTsConfig: false
    }
    // TODO allow customizing this
    // runtimeConfig: { ...nitroOptions?.runtimeConfig },
  };
}

async function buildNitro(options: BuildApplicationOptions): Promise<void> {
  const logger = options.logger.createLongProcessLogger('Building nitro server', options.angularOptions.prerender ? 2 : 1);
  const nitroConfig = await getNitroConfig(options);

  // @ts-ignore
  const { createNitro, build, prepare, copyPublicAssets, prerender } = await import('nitropack');

  const nitro = await createNitro({
    dev: false,
    ...nitroConfig
  });

  await prepare(nitro);
  await copyPublicAssets(nitro);

  // const indexOutput = `${ nitroConfig?.output?.publicDir }/index.html`;
  // if (
  //   nitroConfig?.prerender?.routes
  //   && nitroConfig?.prerender?.routes.find((route: string) => route === '/')
  //   && existsSync(indexOutput)
  // ) {
  //   // Remove the root index.html so it can be replaced with the prerendered version
  //   unlinkSync(`${ nitroConfig?.output?.publicDir }/index.html`);
  // }


  if (options.angularOptions.prerender) {
    logger.logProgress(`Prerendering static pages`);
    await prerender(nitro);
  }

  logger.logProgress('Building Server files');
  await build(nitro);

  await nitro.close();

  // Clean up the temp server folder generated by Angular
  const tempDir = normalizePath(join(options.workspaceRoot, options.outputPath, 'server'));
  fs.removeSync(tempDir);

  logger.end();
}

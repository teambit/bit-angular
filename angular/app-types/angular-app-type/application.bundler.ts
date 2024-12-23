/* eslint-disable no-param-reassign */
import { OutputHashing } from '@angular-devkit/build-angular';
import { VERSION } from '@angular/cli';
import { dedupPaths, getLoggerApi, normalizePath } from '@bitdev/angular.dev-services.common';
import { type ApplicationBuilderOptions, buildApplicationInternal } from '@bitdev/angular.dev-services.ng-compat';
import { Logger } from '@teambit/logger';
import assert from 'assert';
import fs from 'fs-extra';
// @ts-ignore
import type { NitroConfig } from 'nitropack';
import { fileURLToPath } from 'node:url';
import { basename, extname, join, posix, relative, resolve } from 'path';
import definePlugin from './plugins/define.plugin.js';
import { getIndexInputFile } from './utils.js';

export type BuildApplicationOptions = {
  angularOptions: Partial<ApplicationBuilderOptions>;
  outputPath: string;
  sourceRoot: string;
  workspaceRoot: string;
  logger: Logger;
  tempFolder: string;
  entryServer?: string;
  envVars: any;
}

// TODO allow customizing this
const BUILDER_NAME = '@angular-devkit/build-angular:application';

export async function buildApplication(options: BuildApplicationOptions): Promise<void> {
  const { angularOptions: { tsConfig, server, define }, envVars } = options;
  assert(tsConfig, 'tsConfig option is required');
  const isSsr = !!server && Number(VERSION.major) >= 17;
  if (isSsr && Number(VERSION.major) < 19) {
    addEntryServer(options);
  }
  const appOptions = getAppOptions(options, isSsr);
  const builderContext = getBuilderContext(options, appOptions);
  const codePlugins = [definePlugin({ ...envVars, ...define || {} })];
  const extensions: any = (Number(VERSION.major) >= 17 && Number(VERSION.minor) >= 1) ? { codePlugins } : [];

  for await (const result of buildApplicationInternal(
    appOptions as any,
    builderContext,
    { write: true },
    extensions
  )) {
    if (!result.success && result.errors) {
      throw new Error(result.errors.map((err: any) => err.text).join('\n'));
    }
  }

  // Versions of Angular <19 require a nitro middleware to support SSR API endpoints
  if (isSsr && Number(VERSION.major) < 19) {
    await buildNitro(options);
  }
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

  const dedupedAssets = dedupPaths([posix.join(sourceRoot, `assets/**/*`), ...(angularOptions.assets ?? [])]);
  const dedupedStyles = dedupPaths([posix.join(sourceRoot, `styles.${angularOptions.inlineStyleLanguage}`), ...(angularOptions.styles ?? [])]);

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
    optimization: false,//angularOptions.optimization ?? true,
    aot: true,
    deleteOutputPath: true,
    sourceMap: angularOptions.sourceMap ?? true,
    outputHashing: OutputHashing.None,//angularOptions.outputHashing ?? OutputHashing.All,
    watch: false,
    outputMode: angularOptions.outputMode ?? (isSsr ? 'server' : 'static'),
    server: isSsr ? angularOptions.server ?? serverPath : undefined,
    prerender: isSsr ? (angularOptions.prerender ?? !!angularOptions.server) : undefined,
    ssr: isSsr ? {
      entry: entryServer
    } : undefined
  };
}


function getBuilderContext(options: BuildApplicationOptions, appOptions: ApplicationBuilderOptions): any {
  const { workspaceRoot, sourceRoot, tempFolder } = options;
  return {
    id: 1,
    builder: {
      builderName: BUILDER_NAME,
      description: 'Bit Angular Application Builder',
      optionSchema: {}
    },
    logger: getLoggerApi(options.logger),
    workspaceRoot: workspaceRoot,
    currentDirectory: '',
    // doesn't matter, just needs to exist
    target: {
      project: 'bit-ng-app-builder',
      target: 'build'
    },
    getProjectMetadata: function (): Promise<any> {
      return Promise.resolve({
        root: '',
        sourceRoot,
        cli: { cache: { enabled: true, path: resolve(tempFolder, 'angular/cache') } }
      });
    },
    addTeardown: () => {
    },
    getBuilderNameForTarget: () => Promise.resolve(BUILDER_NAME),
    getTargetOptions: () => Promise.resolve(appOptions as any),
    validateOptions: () => Promise.resolve(appOptions as any)
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

  const prerenderedRoutes = prerender ? (await import(`${outputDir}/prerendered-routes.json`, { assert: { type: 'json' } })).default : undefined;

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

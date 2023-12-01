import { default as analog } from '@analogjs/platform';
import { isAppBuildContext, normalizePath } from '@bitdev/angular.dev-services.common';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import assert from 'assert';
import { basename, extname, join, posix, resolve } from 'path';
// @ts-ignore
import type { InlineConfig } from 'vite';
import { getIndexInputFile, htmlPlugin } from './plugins/index-html.plugin';
import { BuildMode, NgViteOptions, ViteAspectsContext } from './utils/types';
import { joinPathFragments } from './utils/utils';

type ConfigFactoryOptions = NgViteOptions & { context: DevServerContext | BundlerContext };


const SSR_DIR = 'ssr';
const BROWSER_DIR = 'browser';

/**
 * Generate Vite configuration object based on provided options.
 *
 * @param {ConfigFactoryOptions} options - The options for generating the configuration.
 * @param {ViteAspectsContext} aspectContext - The context object for Vite aspects.
 * @return {Promise<InlineConfig>} - The generated Vite configuration object.
 */
export async function configFactory(
  options: ConfigFactoryOptions,
  aspectContext: ViteAspectsContext
): Promise<InlineConfig> {
  const { mergeConfig } = await import('vite');
  const {
    angularOptions: { tsConfig, index },
    context: { rootPath, envRuntime },
    context,
    name,
    outputPath
  } = options;
  assert(rootPath, 'rootPath is required');
  assert(outputPath, 'outputPath is required');
  const { workspace } = aspectContext;
  const idName = `${ envRuntime.id }/${ name }`;
  const tempFolder = workspace ? workspace.getTempDir(idName) : join(CACHE_ROOT, idName);
  const indexPath = getIndexInputFile(index!);
  const browserDir = normalizePath(resolve(outputPath, BROWSER_DIR));
  const ssrDir = normalizePath(resolve(outputPath, SSR_DIR));

  assert(isAppBuildContext(context), 'Angular vite only support apps for now');
  let appRootPath: string;
  const capsule = (options.context as any).capsule;
  if (capsule) {
    appRootPath = capsule.path;
  } else {
    appRootPath = workspace?.componentDir(context.appComponent.id, {
      ignoreVersion: true
    }) || '';
  }
  const tsconfigPath = tsConfig ?? posix.join(appRootPath, 'tsconfig.app.json');

  const baseConfig = createBaseConfig(options, tsconfigPath, tempFolder, browserDir, ssrDir, appRootPath, indexPath);
  const serverConfig = await createServerConfig(rootPath);
  const buildConfig = createBuildConfig(browserDir, appRootPath, indexPath);
  const testConfig = createTestConfig();

  return mergeConfig(
    baseConfig,
    {
      build: buildConfig
      //server: serverConfig,
      //test: testConfig
    }
  );
}

function createBaseConfig(options: ConfigFactoryOptions, tsconfigPath: string, tempFolder: string, browserDir: string, ssrDir: string, appRootPath: string, indexPath: string) {
  const {
    angularOptions: { baseHref, server, ssr },
    angularOptions,
    context: { rootPath },
    buildMode,
    outputPath,
    sourceRoot
  } = options;

  assert(rootPath, 'rootPath is required');
  assert(outputPath, 'outputPath is required');

  // TODO: fix this
  const entryServer = ''; //(ssr as SsrClass)?.entry as string;

  const baseConfig: InlineConfig = {
    // publicDir: 'src/assets', // todo
    root: join(appRootPath, sourceRoot || 'src'),
    base: baseHref ?? './',
    mode: buildMode,
    resolve: {
      mainFields: ['module']
    },
    define: {
      'import.meta.vitest': buildMode !== BuildMode.Production
    },
    plugins: [
      analog({
        vite: {
          tsconfig: tsconfigPath
        },
        ssr: !!server,
        ssrBuildDir: ssr ? ssrDir : undefined,
        entryServer: resolve(appRootPath, entryServer),
        nitro: {
          alias: ssr ? {
            '#analog/ssr': join(ssrDir, basename(entryServer, extname(entryServer))),
            '#analog/index': join(browserDir, basename(indexPath))
          } : {},
          serverAssets: ssr ? [{
            baseName: 'public',
            dir: browserDir
          }] : [],
          publicAssets: ssr ? [{
            dir: browserDir
          }] : [],
          output: ssr ? {
            dir: normalizePath(resolve(outputPath, 'server')),
            publicDir: normalizePath(resolve(outputPath, 'server/public'))
          } : {},
          buildDir: normalizePath(resolve(tempFolder, 'nitro')),
          prerender: {
            concurrency: 4
          }
        },
        index: indexPath,
        workspaceRoot: appRootPath
      })
    ]
  };

  if (server) {
    // When running the ssr dev server, CTRL+C doesn't seem to work anymore (bug in nitro?)
    // This is a workaround to make sure the process exits when CTRL+C is pressed
    process.on('SIGINT', () => process.exit(1));
  } //else {
    // When we are not using ssr, we need to add the html plugin to generate the index.html file
  baseConfig.plugins!.push(htmlPlugin(angularOptions, rootPath!, indexPath, !!ssr));
  //}
  return baseConfig;
}

async function createServerConfig(rootPath: string) {
  const { searchForWorkspaceRoot } = await import('vite');
  return {
    fs: {
      allow: [
        searchForWorkspaceRoot(joinPathFragments(rootPath)),
        joinPathFragments('.', 'node_modules/vite')
      ]
    }
  };
}

function createBuildConfig(browserDir: string, appRootPath: string, indexPath: string) {
  return {
    target: ['es2020'],
    outDir: browserDir,
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  };
}

function createTestConfig() {
  return {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.ts'],
    include: ['**/*.spec.ts']
  };
}





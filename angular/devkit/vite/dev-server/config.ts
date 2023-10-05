// @ts-nocheck
// Make sure bit recognizes the dependencies
import '@mdx-js/react';
import 'node-stdlib-browser';
import { relative } from 'path';
import { defineConfig, InlineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { ViteDevServerAspectsContext, ViteDevServerOptions } from '../ng-vite-dev-server';
import { getHostAlias } from './utils';
// import react from "@vitejs/plugin-react";
// import mdx from "vite-plugin-mdx";
// import { htmlPlugin } from "./html-plugin";
// import mdxOptions from "./mdx-config";

/**
 * Generate a Vite config for dev server.
 *
 * 1. alias/fallbacks/provide for Node APIs and host deps
 * 2. module loaders like for MDX
 * 3. root path, public path, entry files, and html
 * 4. websocket protocol
 */
export async function configFactory(options: ViteDevServerOptions, aspectContext: ViteDevServerAspectsContext, port: number): Promise<InlineConfig> {
  const { devServerContext: { publicPath, entry, id, rootPath, envRuntime, }, define, alias, plugins, transformers, } = options;
  const { workspace, pubsub } = aspectContext;
  const entries = entry;

  const root = options.root ?? workspace.path;
  const publicDir = relative(workspace.path, publicPath);
  const base = options.base ?? `/${rootPath}/`;

  // TODO: for WebpackBitReporterPlugin
  // id;
  // pubsub;

  // e.g. teambit.vite/examples/vue/vue@07106b6c1256c0efd94804266c07572a450cf675
  const envId = envRuntime.id;
  // directory to place preview.root files
  // const previewRootDir = `./node_modules/.cache/bit/teambit.ui`;
  // directory to place preview entries files
  // e.g. ./node_modules/.cache/bit/teambit.preview/preview/{envId}/compositions-1687107103571.js
  // const entriesDir = `./node_modules/.cache/bit/teambit.preview/preview/${envId}`;
  // directory to place vite cache
  // TODO
  //   const cacheDir = `./node_modules/.cache/bit/teambit.vite/vite-dev-server/${envId}`;
  const cacheDir = `./node_modules/.cache/bit/bitdev.angular/vite-dev-server/${envId}`;

  // set host deps as alias
  const hostAlias = getHostAlias(options.devServerContext);

  // get full component list from workspace, and then
  // - ignore them from watch
  // - exclude them from optimizeDeps
  const components = await workspace.list();
  const packageList = components.map(c => workspace.componentPackageName(c));

  const config: InlineConfig = defineConfig({
    configFile: false,
    envFile: false,
    root,
    base,
    publicDir,
    define,
    resolve: {
      mainFields: ['module'],
      alias: [
        {
          // this is required for the SCSS modules
          find: /^~(.*)$/,
          replacement: '$1'
        },
        ...hostAlias,
        ...alias || []
      ],
    },
    // apply different cache dir for each env
    cacheDir,
    server: {
      port,
      watch: {
        // 1. preview root
        // 2. entry files
        // 3. local packages
        ignored: [
          ...packageList.map(p => `!**/node_modules/${p}/**`),
        ]
      },
      fs: {
        strict: false
      }
    },
    optimizeDeps: {
      entries,
      // exclude: packageList,
    },
    // TODO: make it replaceable and reusable
    plugins: [
      nodePolyfills(),
      // react(),
      // mdx(mdxOptions),
      // htmlPlugin(entries),
      ...plugins || [],
    ],
  });

  // apply transformers
  if (transformers) {
    transformers.forEach(transformer => {
      transformer(config);
    });
  }

  return config;
}





import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import rollupJson from '@rollup/plugin-json';
// @ts-ignore
import nodeResolve from '@rollup/plugin-node-resolve';
import { Logger } from '@teambit/logger';
import * as rollup from 'rollup';
import { TransformHook } from 'rollup';
// import { minify } from 'rollup-plugin-esbuild';
// import html from '@rollup/plugin-html';
// import sourcemaps from 'rollup-plugin-sourcemaps';
// @ts-ignore
import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { ngcPlugin } from './ngc-plugin';
// import { ensureUnixPath } from './utils/path';
import { generateKey, readCacheEntry, saveCacheEntry } from './utils/cache';
import { getNodeJSFileSystem, ngBabelLinker, ngCompilerCli, ngccCompilerCli } from './utils/ng-compiler-cli';

export type OutputFileCache = Map<string, { version: string; content: string }>;

/**
 * Options used in `ng-packagr` for writing flat bundle files.
 *
 * These options are passed through to rollup.
 */
export interface RollupOptions {
  moduleName: string;
  entries: string[] | string | { [entryAlias: string]: string };
  dest: string;
  sourceRoot: string;
  transform?: TransformHook;
  cache?: rollup.RollupCache;
  cacheDirectory?: string | false;
  fileCache?: OutputFileCache;
  cacheKey?: string;
  nodeModulesPaths?: string[];
  internals?: string[];
  externals?: string[];
  compilationMode?: CompilationMode;
}

export type CompilationMode = 'full' | 'partial';

export class RollupCompiler {
  cache?: rollup.RollupCache;

  constructor(private tsCompilerOptions: AngularCompilerOptions = {}, private logger: Logger) {
  }

  isExternalDependency(moduleId: string, externals: string[] = [], internals: string[] = []): boolean {
    return internals.every(exception => !moduleId.includes(exception))
      && (externals.some(external => moduleId.includes(external)) || moduleId.includes('node_modules'));
  }

  async bundleFiles(opts: RollupOptions) {
    const {cacheDirectory} = opts;

    /** File system used by the Angular linker plugin. */
    const NodeJSFileSystem = await getNodeJSFileSystem();
    const fileSystem = new NodeJSFileSystem();

    /** Logger used by the Angular linker plugin. */
    let ConsoleLogger: any; let LogLevel: any;
    const ngCompilerCliApi = await ngCompilerCli() as any;
    if (ngCompilerCliApi.ConsoleLogger && ngCompilerCliApi.LogLevel) {
      ConsoleLogger = ngCompilerCliApi.ConsoleLogger;
      LogLevel = ngCompilerCliApi.LogLevel;
    } else {
      const ngccCompilerCliApi = await ngccCompilerCli() as any;
      ConsoleLogger = ngccCompilerCliApi.ConsoleLogger;
      LogLevel = ngccCompilerCliApi.LogLevel;
    }
    const logger = new ConsoleLogger(LogLevel.info);

    /** Linker babel plugin. */
    const { createEs2015LinkerPlugin } = await ngBabelLinker();
    const linkerPlugin = (createEs2015LinkerPlugin as any)({
      fileSystem,
      logger,
      linkerJitMode: false
    });

    const bundle = await rollup.rollup({
      context: 'this',
      external: moduleId => this.isExternalDependency(moduleId, opts.externals, opts.internals),
      cache: opts.cache ?? (cacheDirectory ? await readCacheEntry(cacheDirectory, opts.cacheKey!) : undefined),
      input: opts.entries,
      plugins: [
        commonjs(),
        nodeResolve({
          modulePaths: opts.nodeModulesPaths ?? ['node_modules'],
          dedupe: [
            '@angular/build',
            '@angular/cdk',
            '@angular/core/schematics',
            '@angular/core/rxjs-interop',
            '@angular/core/primitives/signals',
            '@angular/core/primitives/event-dispatch',
            '@angular/core/testing',
            '@angular/core',
            '@angular/common/http',
            '@angular/common/locales',
            '@angular/common/testing',
            '@angular/common',
            '@angular/animations/browser',
            '@angular/animations',
            '@angular/cli',
            '@angular/compiler',
            '@angular/compiler-cli',
            '@angular/forms',
            '@angular/material',
            '@angular/platform-browser/animations/async',
            '@angular/platform-browser/animations',
            '@angular/platform-browser/testing',
            '@angular/platform-browser',
            '@angular/platform-browser-dynamic/testing',
            '@angular/platform-browser-dynamic',
            '@angular/platform-server/init',
            '@angular/platform-server/testing',
            '@angular/platform-server',
            '@angular/router/upgrade',
            '@angular/router/testing',
            '@angular/router',
            '@angular/ssr/schematics',
            '@angular/ssr'
          ]
        }),
        // sourcemaps({
        //   readFile: (path: string, callback: (error: Error | null, data: Buffer | string) => void) => {
        //     const fileData = opts.fileCache.get(ensureUnixPath(path));
        //     console.log(path, fileData)
        //     callback(fileData ? null : new Error(`Could not load '${path}' from memory.`), fileData?.content);
        //   },
        // }),
        rollupJson(),
        await ngcPlugin({ rootDir: opts.sourceRoot, internals: opts.internals, externals: opts.externals, compilationMode: opts.compilationMode || 'partial', tsCompilerOptions: this.tsCompilerOptions }, this.logger),
        babel({ plugins: [linkerPlugin], babelHelpers: 'bundled', compact: false }), // TODO set compact false only for dev
        opts.transform ? { transform: opts.transform, name: 'downlevel-ts' } : undefined
        // minify({legalComments: "none"}),
        // html()
      ],
      onwarn: warning => {
        switch (warning.code) {
          case 'UNUSED_EXTERNAL_IMPORT':
          case 'THIS_IS_UNDEFINED':
            break;

          default:
            this.logger.consoleWarning(warning.message);
            break;
        }
      },
      preserveSymlinks: true,
      // Disable treeshaking when generating bundles
      // see: https://github.com/angular/angular/pull/32069
      treeshake: false
    });

    // Output the bundle to disk
    const output = await bundle.write({
      name: opts.moduleName,
      inlineDynamicImports: false,
      preserveModules: true,
      format: 'es',
      dir: opts.dest,
      banner: '',
      sourcemap: true,
      // manualChunks: (moduleId: string) => this.isExternalDependency(moduleId) ? 'vendor' : 'main'
    });

    if (cacheDirectory) {
      await saveCacheEntry(cacheDirectory, opts.cacheKey!, JSON.stringify(bundle.cache));
    }

    // Close the bundle to let plugins clean up their external processes or services
    await bundle.close();

    return {
      output: output.output,
      cache: bundle.cache
    };
  }

  async compile(opts: RollupOptions, watch = false) {
    const { fileCache = new Map() } = opts;
    const compilationMode = opts.compilationMode || 'partial';

    const bundle = await this.bundleFiles({
      sourceRoot: opts.sourceRoot,
      entries: opts.entries,
      moduleName: opts.moduleName,
      dest: opts.dest,
      // eslint-disable-next-line no-nested-ternary
      cache: opts.cache ? opts.cache : (watch && this.cache ? this.cache : undefined),
      cacheDirectory: opts.cacheDirectory,
      fileCache,
      cacheKey: await generateKey(JSON.stringify(opts.entries), opts.moduleName, opts.dest, compilationMode),
      nodeModulesPaths: opts.nodeModulesPaths,
      transform: opts.transform,
      internals: opts.internals,
      externals: opts.externals,
      compilationMode
    });

    if (watch) {
      this.cache = bundle.cache;
    }

    return bundle;
  }
}

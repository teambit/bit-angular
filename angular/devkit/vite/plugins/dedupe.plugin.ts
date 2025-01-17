import { Plugin, PluginBuild, ResolveResult } from 'esbuild';

const DEDUPE_PACKAGE_RESOLUTION = Symbol('DEDUPE_PACKAGE_RESOLUTION');
const resolvedPaths = new Map<string, Promise<ResolveResult>>();

function toESBuildFilter(packages: string[] = ['@angular/', '@ngrx/', 'apollo-angular']): RegExp {
  const patterns = packages.map((pkg) => pkg.replace(/\//g, '[\\/]'));
  const conditionalPatterns = patterns.join('|');
  return new RegExp(`^(${ conditionalPatterns })`);
}

/**
 * Creates a plugin that stores the first resolved path and returns it on subsequent requests,
 * effectively deduping packages.
 */
export default function dedupePlugin(options?: { packages?: string[] }): Plugin {
  const pattern = toESBuildFilter(options?.packages);
  return {
    name: 'dedupe-packages',
    setup(build: PluginBuild) {
      // Only attempt resolve of Angular packages for now
      build.onResolve({ filter: pattern }, async args => {
        if (args.pluginData?.[DEDUPE_PACKAGE_RESOLUTION]) {
          return null;
        }
        if (resolvedPaths?.has(args.path)) {
          return resolvedPaths.get(args.path);
        }

        const { importer, kind, resolveDir, namespace, pluginData = {} } = args;
        pluginData[DEDUPE_PACKAGE_RESOLUTION] = true;

        const result = build.resolve(args.path, {
          importer,
          kind,
          namespace,
          pluginData,
          resolveDir,
        });

        resolvedPaths.set(args.path, result);

        return result;
      });
    },
  };
}

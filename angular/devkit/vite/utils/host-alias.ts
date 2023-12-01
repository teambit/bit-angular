// @ts-nocheck

import findRoot from 'find-root';
import type { Alias } from 'vite';
import type {BundlerContext, DevServerContext} from '@teambit/bundler';

export type ViteContext = {
  /**
   * A path for the host root dir
   * Host root dir is usually the env root dir
   * This can be used in different bundle options which run require.resolve
   * for example when configuring webpack aliases or webpack expose loader on the peers deps
   */
  hostRootDir?: string;
  /**
   * Array of host dependencies, they are used later in case you use one of the following:
   *
   */
  hostDependencies?: string[];
  /**
   * Make the hostDependencies externals. externals (from webpack docs):
   * The externals configuration option provides a way of excluding dependencies from the output bundles.
   * Instead, the created bundle relies on that dependency to be present in the consumer's (any end-user application) environment.
   */
  externalizeHostDependencies?: boolean;
  /**
   * Make aliases for the hostDependencies.
   * the path of each one will be resolved by [hostRootDir, process.cwd(), __dirname]
   * this will usually replace the instance of import one of the host dependencies by the instance of the env provided it
   */
  aliasHostDependencies?: boolean;
};

export function getHostAlias(context: BundlerContext | DevServerContext): [] {
  const alias: Alias[] = [];
  const { hostDependencies: deps, aliasHostDependencies, hostRootDir } = context;
  if (deps && aliasHostDependencies) {
    deps.forEach(dep => {
      let resolved: string;
      try {
        resolved = require.resolve(dep, { paths: [hostRootDir, process.cwd(), __dirname] });
        const folder = findRoot(resolved);
        alias.push({
          find: dep,
          replacement: folder
        })
      } catch (e) {
        if (resolved) {
          alias.push({
            find: dep,
            replacement: resolved
          })
        }
      }
    })
  }
  return alias;
}

import { Resolver } from 'enhanced-resolve';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

// @ts-ignore
import getInnerRequest from 'enhanced-resolve/lib/getInnerRequest';

const regex = /^@angular\/(.*)$/;

/**
 * This webpack plugin resolves Angular packages to the capsule node_modules when possible in order to avoid getting
 * errors with multiple instances of the same module (like "Uncaught TypeError: Cannot read property 'bindingStartIndex'
 * of null")
 */
export class AngularModulesResolverPlugin {
  private modulePaths = new Map<string, string>();

  constructor(private nodeModulesPaths: string[], private usingNgcc = true) {}

  apply(resolver: Resolver) {
    const source = resolver.ensureHook('before-resolve');
    const target = resolver.ensureHook('resolve');

    resolver
      .getHook(source)
      .tapAsync('AngularWebpackResolverPlugin', (request: any, resolveContext: any, callback: any) => {
        if (!request) {
          return callback();
        }
        const originalRequest = getInnerRequest(resolver, request);

        if (
          // Ignore empty requests
          !originalRequest ||
          // Relative or absolute requests are not mapped
          originalRequest.startsWith('.') || originalRequest.startsWith('/') ||
          // Ignore all webpack special requests
          originalRequest.startsWith('!!') ||
          // Only work on Javascript/TypeScript issuers.
          !request.context.issuer || !request.context.issuer.match(/\.[jt]sx?$/)
        ) {
          return callback();
        }

        // Let's check if the request is an angular module name
        const match = originalRequest.match(regex);
        if (match) {
          let alias = this.modulePaths.get(originalRequest);
          if (!alias) {
            try {
              // Resolve to the folder containing package.json (root of the module)
              for(let i = 0; i<this.nodeModulesPaths.length; i++) {
                const resolvedPackage = require.resolve(`${originalRequest}/package.json`, {paths: [this.nodeModulesPaths[i]]});
                // if we don't use ngcc, we can use the first version that we find
                if(!this.usingNgcc) {
                  alias = dirname(resolvedPackage);
                  break;
                }
                // Check if package.json says it has been processed by ngcc
                const { __processed_by_ivy_ngcc__ } = require(resolvedPackage);
                if(__processed_by_ivy_ngcc__) {
                  alias = dirname(resolvedPackage);
                  break;
                }
              }
              // TODO if there is no alias we should run ngcc on the first resolved valid path
            } catch (e) {
              return callback();
            }
            if (!alias || !existsSync(alias)) {
              return callback();
            }
            this.modulePaths.set(originalRequest, alias);
          }
          const obj = { ...request, request: alias };
          const msg = `aliased with mapping "${originalRequest}": "${alias}"`;
          return resolver.doResolve(target, obj, msg, resolveContext, (err: any, result: any) => {
            if (err) {
              return callback(err);
            }

            // Don't allow other aliasing or raw request
            if (result === undefined) {
              return callback(null, null);
            }
            callback(null, result);
          });
        }
        return callback();
      });
  }
}

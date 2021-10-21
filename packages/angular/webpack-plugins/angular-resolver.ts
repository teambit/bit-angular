import { Resolver } from 'enhanced-resolve';
import { existsSync } from 'fs';
import { dirname } from 'path';

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

  constructor(private nodeModulesPaths: string[]) {}

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
              alias = dirname(require.resolve(`${originalRequest}/package.json`, {paths: this.nodeModulesPaths}));
            } catch (e) {
              return callback();
            }
            if (!existsSync(alias)) {
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

import { Resolver } from 'enhanced-resolve';
import { existsSync } from 'fs';
import { dirname } from 'path';

const getInnerRequest = require('enhanced-resolve/lib/getInnerRequest');

const regex = /^@angular\/(.*)$/;

/**
 * This webpack plugin resolves Angular packages to the capsule node_modules in order to avoid getting errors with
 * multiple versions of the same module (like "Uncaught TypeError: Cannot read property 'bindingStartIndex' of null")
 */
export class AngularModulesResolverPlugin {
  apply(resolver: Resolver) {
    const source = resolver.ensureHook('before-resolve');
    const target = resolver.ensureHook('resolve');

    resolver
      .getHook(source)
      .tapAsync('AngularWebpackResolverPlugin', (request: any, resolveContext, callback) => {
        if (!request /*|| request.typescriptPathMapped*/) {
          return callback();
        }
        const originalRequest = getInnerRequest(resolver, request);
        if (!originalRequest) {
          return callback();
        }

        // Only work on Javascript/TypeScript issuers.
        if (!request.context.issuer || !request.context.issuer.match(/\.[jt]sx?$/)) {
          return callback();
        }

        // Relative or absolute requests are not mapped
        if (originalRequest.startsWith('.') || originalRequest.startsWith('/')) {
          return callback();
        }

        // Ignore all webpack special requests
        if (originalRequest.startsWith('!!')) {
          return callback();
        }

        const match = originalRequest.match(regex);
        if (match) {
          // resolve to the folder containing package.json (root of the module)
          const alias = dirname(require.resolve(`${originalRequest}/package.json`));
          if (!existsSync(alias)) {
            return callback();
          }
          const obj = { ...request, request: alias };
          const msg = `aliased with mapping "${match[0]}": "${alias}"`;
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

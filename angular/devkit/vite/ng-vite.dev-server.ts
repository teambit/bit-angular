import type { DevServer, DevServerContext } from '@teambit/bundler';
import type { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { ViteDevServer, ViteDevServerOptions } from '@teambit/vite.vite-dev-server';
import { configFactory } from './config.factory';
import { NgViteOptions } from './utils/types';

// Extracted constant
const DEFAULT_SERVER_NAME = 'ng-vite-dev-server';

export class NgViteDevServer {
  static from(options: NgViteOptions & { context: DevServerContext }): AsyncEnvHandler<DevServer> {
    return async(context: EnvContext): Promise<DevServer> => {
      options.name = options.name || DEFAULT_SERVER_NAME;
      const logger = context.createLogger(options.name);
      const workspace = context.getAspect<any>('teambit.workspace/workspace');

      const ngConfig = await configFactory(options, { logger, workspace });

      // @ts-ignore
      function transformer(config: any, vite: typeof import('vite')): any {
        return vite.mergeConfig(config, ngConfig);
      }

      const viteConfig: ViteDevServerOptions = {
        define: ngConfig.define,
        devServerContext: options.context as DevServerContext,
        name: options.name,
        optimizeEntries: options.optimizeEntries as any,
        plugins: ngConfig.plugins as any,
        resolveHostAlias: true,
        // Improved readability for transformers array
        transformers: [
          transformer, ...(options.transformers ?? [])
        ]
      };

      return ViteDevServer.from(viteConfig)(context);
    };
  }
}


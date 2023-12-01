import type { Bundler, BundlerContext } from '@teambit/bundler';
import type { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { Logger } from '@teambit/logger';
import { ViteBundler, ViteBundlerOptions } from '@teambit/vite.vite-bundler';
import type { Workspace } from '@teambit/workspace';
// @ts-ignore
import type { InlineConfig } from 'vite';
import { configFactory } from './config.factory';
import { NgViteOptions } from './utils/types';

export class NgViteBundler {

  static from(options: NgViteOptions & { context: BundlerContext }): AsyncEnvHandler<Bundler> {
    return async(context: EnvContext): Promise<Bundler> => {
      options.name = options.name || 'ng-vite-bundler';
      const logger: Logger = context.createLogger(options.name);
      const workspace: Workspace = context.getAspect<any>('teambit.workspace/workspace');

      const ngConfig = await configFactory(options, { logger, workspace });
      // @ts-ignore
      const transformer: any = (config: InlineConfig, vite: typeof import('vite')): InlineConfig => {
        return vite.mergeConfig(config, ngConfig);
      };

      const viteConfig: ViteBundlerOptions = {
        bundlerContext: options.context as BundlerContext,
        name: options.name,
        resolveHostAlias: true,
        transformers: [transformer, ...options.transformers ?? []]
      };

      return ViteBundler.from(viteConfig)(context);
    };
  }
}


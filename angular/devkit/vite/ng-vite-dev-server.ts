import { default as ngVitePlugin } from '@analogjs/vite-plugin-angular';
import {
  AngularEnvOptions,
  BrowserOptions,
  DevServerOptions,
  isAppDevContext
} from '@bitdev/angular.dev-services.common';
import type { DevServer, DevServerContext } from '@teambit/bundler';
import type { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import type { Logger } from '@teambit/logger';
import type { PubsubMain } from '@teambit/pubsub';
import type { Workspace } from '@teambit/workspace';
import type { Server } from 'http';
import { posix } from 'path';
// @ts-ignore
import type { Alias, InlineConfig, Plugin, PluginOption } from 'vite';
import { configFactory } from './dev-server/config';
import { htmlPlugin } from './plugins/index-html.plugin';


export type NgViteDevServerOptions = {
  angularOptions: Partial<BrowserOptions & DevServerOptions>;

  /**
   * context of the dev server execution.
   */
  devServerContext: DevServerContext;

  /**
   * name of the dev server.
   */
  name?: string;

  ngEnvOptions: AngularEnvOptions;

  sourceRoot?: string;

  // TODO: fix type once we can support preview with vite
  transformers?: (ViteConfigTransformer | any)[];

  // TODO: remove this once we can support preview with vite
  [key: string]: any;
};


export type ViteConfigTransformer = (config: InlineConfig) => void;

export type ViteDevServerAspectsContext = {
  logger: Logger;
  workspace: Workspace;
  pubsub: PubsubMain;
};

export type ViteDevServerOptions = {
  /**
   * name of the dev server.
   */
  name?: string;

  /**
   * context of the dev server execution.
   */
  devServerContext: DevServerContext;

  /**
   * optimize entries before passing them to Vite.
   */
  optimizeEntries?: (entries: string[], context: ViteDevServerAspectsContext) => string[];

  /**
   * root path of the dev server.
   */
  root?: string;

  /**
   * base URL to use for all relative URLs in a document
   */
  base?: string;

  /**
   * variables to be injected to the dev server.
   */
  define?: Record<string, any>;

  /**
   * alias to be injected to the dev server.
   */
  alias?: Alias[];

  /**
   * list of plugins to be injected to the dev server.
   */
  plugins?: PluginOption[];

  /**
   * list of transformers to modify Vite config in an advanced way.
   */
  transformers?: ViteConfigTransformer[];
};

export class NgViteDevServer {
  id = 'ng-vite-dev-server';

  constructor(
    private options: ViteDevServerOptions,
    private aspectContext: ViteDevServerAspectsContext
  ) {
  }

  async listen(port: number): Promise<Server> {
    const config: InlineConfig = await configFactory(this.options, this.aspectContext, port);
    const vite = await import('vite');
    const server = await vite.createServer(config);
    await server.listen(port);
    if (!server.httpServer) {
      throw new Error('vite server failed to start');
    }
    return server.httpServer;
  }

  static from(options: NgViteDevServerOptions): AsyncEnvHandler<DevServer> {
    return async(context: EnvContext): Promise<DevServer> => {
      const rootPath = options.devServerContext.rootPath;
      const name = options.name || 'vite-dev-server';
      const logger = context.createLogger(name);
      const workspace: Workspace = context.getAspect<any>('teambit.workspace/workspace');
      const pubsub = context.getAspect<any>('teambit.harmony/pubsub');

      let appRootPath: string;
      let tsconfigPath: string;
      if (isAppDevContext(options.devServerContext)) { // When you use `bit run <app>`
        appRootPath = workspace?.componentDir(options.devServerContext.appComponent.id, {
          ignoreVersion: true
        }) || '';
        tsconfigPath = options?.angularOptions?.tsConfig ?? posix.join(appRootPath, 'tsconfig.app.json');
      } else { // When you use `bit start`
        // appRootPath = getPreviewRootPath(workspace);
        // tsconfigPath = writeTsconfig(options.devServerContext, appRootPath, tempFolder, application, pkg, devFilesMain, workspace);
        throw new Error('vite does not support preview yet');
      }

      const opts = {
        devServerContext: options.devServerContext,
        root: rootPath,
        base: options.angularOptions.baseHref ?? './',
        plugins: [
          ngVitePlugin({
            tsconfig: tsconfigPath,
            workspaceRoot: rootPath
          }) as Plugin[],
          htmlPlugin(options.angularOptions, rootPath, options.sourceRoot)
        ]
      };

      const aspectContext: ViteDevServerAspectsContext = {
        logger,
        workspace,
        pubsub
      };
      return new NgViteDevServer(opts, aspectContext);
    };
  }
}


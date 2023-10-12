import {
  AngularEnvOptions,
  BrowserOptions,
  DevServerOptions
} from '@bitdev/angular.dev-services.common';
import type { DevServerContext } from '@teambit/bundler';
import { Logger } from '@teambit/logger';
import { PubsubMain } from '@teambit/pubsub';
import type { Workspace } from '@teambit/workspace';
// @ts-ignore
import type { Alias, InlineConfig, PluginOption } from 'vite';


export type ViteConfigTransformer = (config: InlineConfig) => void;

export type ViteDevServerAspectsContext = {
  logger: Logger;
  workspace: Workspace;
  pubsub: PubsubMain;
};

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

import { ApplicationOptions, DevServerOptions } from '@bitdev/angular.dev-services.common';
import { Logger } from '@teambit/logger';
import type { ViteDevServerOptions } from '@teambit/vite.vite-dev-server';
import { Workspace } from '@teambit/workspace';


export type ViteAspectsContext = {
  logger: Logger;
  workspace: Workspace;
};

export enum BuildMode {
  Development = 'development',
  Production = 'production',
}

export type NgViteOptions = {
  angularOptions: Partial<ApplicationOptions & DevServerOptions>;

  /** name of the dev server */
  name?: string;

  // TODO: fix type once we can support preview with vite
  /** list of transformers to modify Vite config in an advanced way */
  transformers?: ViteDevServerOptions['transformers'];

  /** optimize entries before passing them to Vite */
  optimizeEntries?: (entries: string[], context: ViteAspectsContext) => string[];

  /** Output folder path for build files */
  outputPath?: string;

  buildMode?: BuildMode;

  sourceRoot?: string;
};

import { ApplicationOptions, BrowserOptions, DevServerOptions } from '@bitdev/angular.dev-services.common';

export enum BuildMode {
  Development = 'development',
  Production = 'production',
}

export type NgViteOptions = {
  angularOptions: any;//Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions>;

  /** name of the dev server */
  name?: string;

  appRootPath: string;

  /** Output folder path for build files */
  outputPath?: string;

  buildMode?: BuildMode;

  sourceRoot?: string;
};

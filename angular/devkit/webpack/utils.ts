import { BundlerSetup } from '@bitdev/angular.dev-services.common';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Logger } from '@teambit/logger';
import type { Configuration, WebpackPluginInstance } from 'webpack';


export type WebpackConfig = Configuration;

export interface WebpackConfigFactoryOpts {
  tempFolder: string;
  context: DevServerContext | BundlerContext;
  tsConfigPath: string;
  rootPath: string;
  logger: Logger;
  setup: BundlerSetup;
  angularOptions: any;
  sourceRoot?: string;
  entryFiles: string[];
  nodeModulesPaths: string[];
  workspaceDir: string;
  plugins: WebpackPluginInstance[];
}

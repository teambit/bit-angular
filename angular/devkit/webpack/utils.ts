import { BundlerSetup } from '@bitdev/angular.dev-services.common';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { ComponentID } from '@teambit/component';
import { Logger } from '@teambit/logger';
import { WebpackConfigWithDevServer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { join, resolve } from 'path';
import type { Configuration, WebpackPluginInstance } from 'webpack';


export type WebpackConfig = Configuration;

export interface WebpackConfigFactoryOpts {
  tempFolder: string;
  context: DevServerContext | BundlerContext;
  tsConfigPath: string;
  rootPath: string;
  logger: Logger;
  setup: BundlerSetup;
  webpackOptions: Partial<WebpackConfigWithDevServer | Configuration>;
  angularOptions: any;
  sourceRoot?: string;
  entryFiles: string[];
  nodeModulesPaths: string[];
  workspaceDir: string;
  plugins: WebpackPluginInstance[];
}


export function getPreviewRootPath(workspace?: Workspace): string {
  try {
    // @bit-ignore
    const rootPath = workspace?.componentDir(ComponentID.fromString('bitdev.angular/dev-services/preview/preview'), {
      ignoreVersion: true
    }, { relative: false }) || '';
    return join(rootPath, 'preview-app');
  } catch (e) {
    // @bit-ignore
    return resolve(require.resolve('@bitdev/angular.dev-services.preview.preview'), '../../preview-app/');
  }
}

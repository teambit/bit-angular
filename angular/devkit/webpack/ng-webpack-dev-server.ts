import {
  AngularEnvOptions,
  BrowserOptions,
  BundlerSetup,
  DevServerOptions,
  getNodeModulesPaths,
  getPreviewRootPath,
  getWorkspace,
  isAppDevContext,
  writeTsconfig
} from '@bitdev/angular.dev-services.common';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { DevServer, DevServerContext } from '@teambit/bundler';
import { DevFilesAspect, DevFilesMain } from '@teambit/dev-files';
import { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { PubsubMain } from '@teambit/pubsub';
import {
  WebpackAspect,
  WebpackConfigDevServerTransformContext,
  WebpackConfigMutator,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer,
  WebpackDevServer,
  WebpackMain
} from '@teambit/webpack';
import { generateTransformers, runTransformers } from '@teambit/webpack.webpack-bundler';
import { join, posix } from 'path';
import type { Configuration } from 'webpack';
import { WebpackConfigFactoryOpts } from './utils';

export type WebpackDevServerOptions = {
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
  /**
   * array of transformers to apply on webpack config.
   */
  transformers?: WebpackConfigTransformer[];
  webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>;
  // tsConfigPath: string;
};

export interface WebpackServeConfigFactoryOpts {
  devServerID: string;
  isApp: boolean;
  publicPath: string;
  publicRoot: string;
  pubsub: PubsubMain;
}

export type WebpackServeConfigFactory =
  (opts: WebpackConfigFactoryOpts & WebpackServeConfigFactoryOpts) => Promise<WebpackConfigWithDevServer>;

export class NgWebpackDevServer {
  static from(options: WebpackDevServerOptions): AsyncEnvHandler<DevServer> {
    return async(context: EnvContext): Promise<DevServer> => {
      if (!options.ngEnvOptions.webpackConfigFactory) {
        throw new Error('ngEnvOptions.webpackConfigFactory is required to use the Webpack dev server');
      }

      const name = options.name || 'ng-webpack-dev-server';
      const logger = context.createLogger(name);
      const {devServerContext} = options;
      const workspace = getWorkspace(context);
      const webpackMain = context.getAspect<WebpackMain>(WebpackAspect.id);
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const devFilesMain = context.getAspect<DevFilesMain>(DevFilesAspect.id);

      let tempFolder: string;
      const idName = `bitdev.angular/${name}`;
      if (workspace) {
        tempFolder = workspace.getTempDir(idName);
      } else {
        tempFolder = join(CACHE_ROOT, idName);
      }

      let appRootPath: string;
      let tsconfigPath: string;
      let isApp = false;
      if (isAppDevContext(devServerContext)) { // When you use `bit run <app>`
        appRootPath = workspace?.componentDir(devServerContext.appComponent.id, {
          ignoreVersion: true
        }) || '';
        tsconfigPath = options?.angularOptions?.tsConfig ?? posix.join(appRootPath, 'tsconfig.app.json');
        isApp = true;
      } else { // When you use `bit start`
        appRootPath = getPreviewRootPath(workspace);
        tsconfigPath = writeTsconfig(devServerContext, appRootPath, tempFolder, application, pkg, devFilesMain, workspace);
      }

      const webpackServeConfigFactory: WebpackServeConfigFactory = options.ngEnvOptions.webpackConfigFactory;
      const config = await webpackServeConfigFactory({
        angularOptions: options.angularOptions ?? {},
        context: devServerContext,
        devServerID: devServerContext.id,
        entryFiles: devServerContext.entry,
        isApp,
        logger,
        nodeModulesPaths: getNodeModulesPaths(false, isolator, workspace),
        plugins: [],
        publicPath: devServerContext.publicPath,
        publicRoot: devServerContext.rootPath,
        pubsub: webpackMain.pubsub,
        rootPath: appRootPath,
        setup: BundlerSetup.Serve,
        sourceRoot: options.sourceRoot ?? 'src',
        tempFolder,
        tsConfigPath: tsconfigPath,
        webpackOptions: options.webpackOptions ?? {},
        workspaceDir: workspace?.path ?? ''
      });

      const configMutator = new WebpackConfigMutator(config);
      const transformerContext: WebpackConfigDevServerTransformContext = Object.assign(devServerContext, { mode: 'dev' as const });
      const internalTransformers = generateTransformers(logger, undefined, transformerContext);
      const transformers = options.transformers || [];

      const afterMutation = runTransformers(
        configMutator.clone(),
        [...internalTransformers, ...transformers],
        transformerContext
      );

      if(!options.ngEnvOptions.webpackModulePath) {
        throw new Error('ngEnvOptions.webpackModulePath is required to use the Webpack dev server');
      }
      if(!options.ngEnvOptions.webpackDevServerModulePath) {
        throw new Error('ngEnvOptions.webpackDevServerModulePath is required to use the Webpack dev server');
      }

      // eslint-disable-next-line import/no-dynamic-require,global-require
      const webpack = require(options.ngEnvOptions.webpackModulePath);
      const webpackDevServer = options.ngEnvOptions.webpackDevServerModulePath;

      return new WebpackDevServer(
        afterMutation.raw as WebpackConfigWithDevServer,
        webpack,
        webpackDevServer
      );
    };
  }
}

import {
  AngularEnvOptions,
  ApplicationOptions,
  BrowserOptions,
  BundlerSetup,
  DevServerOptions,
  getNodeModulesPaths,
  getWorkspace,
  isAppDevContext,
  writeTsconfig
} from '@bitdev/angular.dev-services.common';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { DevServer, DevServerContext } from '@teambit/bundler';
import { Component } from '@teambit/component';
import { DevFilesAspect, DevFilesMain } from '@teambit/dev-files';
import { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { PubsubMain } from '@teambit/pubsub';
import { ScopeAspect, ScopeMain } from '@teambit/scope';
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
import assert from 'assert';
import { join, posix } from 'path';
import { WebpackConfigFactoryOpts } from './utils';

export type WebpackDevServerOptions = {
  angularOptions?: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions>;

  /**
   * context of the dev server execution.
   */
  devServerContext: DevServerContext;

  /**
   * name of the dev server.
   */
  name?: string;

  ngEnvOptions: AngularEnvOptions;

  appRootPath: string;

  sourceRoot?: string;

  /**
   * array of transformers to apply on webpack config.
   */
  transformers?: WebpackConfigTransformer[];
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
      assert(options.ngEnvOptions.webpackConfigFactory, 'ngEnvOptions.webpackConfigFactory is required to use the Webpack dev server');

      const name = options.name || 'ng-webpack-dev-server';
      const logger = context.createLogger(name);
      const { devServerContext } = options;
      const workspace = getWorkspace(context);
      const webpackMain = context.getAspect<WebpackMain>(WebpackAspect.id);
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const scope = context.getAspect<ScopeMain>(ScopeAspect.id);
      const devFilesMain = context.getAspect<DevFilesMain>(DevFilesAspect.id);

      let tempFolder: string;
      const idName = `bitdev.angular/${ name }`;
      if (workspace) {
        tempFolder = workspace.getTempDir(idName);
      } else {
        tempFolder = join(CACHE_ROOT, idName);
      }

      let tsconfigPath: string;
      let isApp = false;
      if (isAppDevContext(devServerContext)) { // When you use `bit run <app>`
        tsconfigPath = options?.angularOptions?.tsConfig ?? posix.join(options.appRootPath, 'tsconfig.app.json');
        isApp = true;
      } else { // When you use `bit start`
        tsconfigPath = writeTsconfig(devServerContext, options.appRootPath, tempFolder, application, pkg, devFilesMain, options?.angularOptions?.tsConfig, workspace);
        // eslint-disable-next-line no-param-reassign
        options.angularOptions = options.angularOptions || {};
        if (options?.angularOptions?.tsConfig) {
          // eslint-disable-next-line no-param-reassign
          options.angularOptions.tsConfig = tsconfigPath;
        }

        // add the assets paths for each component to the angular compiler options
        const assetsPaths: string[] = [];
        devServerContext.components.forEach((component: Component) => {
          const cmpDir = workspace?.componentDir(component.id, { ignoreVersion: true }) || '';
          const assetsDir = `${ cmpDir }/src/assets`;
          if (!assetsPaths.includes(assetsDir)) {
            assetsPaths.push(`${ cmpDir }/src/assets`);
          }
        });
        // eslint-disable-next-line no-param-reassign
        options.angularOptions.assets = [...options.angularOptions.assets || [], ...assetsPaths.map((path) => ({
          'glob': '**/*',
          'input': path,
          'output': '/assets/'
        }))];
      }

      const webpackServeConfigFactory: WebpackServeConfigFactory = options.ngEnvOptions.webpackConfigFactory;
      const config = await webpackServeConfigFactory({
        angularOptions: options.angularOptions ?? {},
        context: devServerContext,
        devServerID: devServerContext.id,
        entryFiles: devServerContext.entry,
        isApp,
        logger,
        nodeModulesPaths: getNodeModulesPaths(false, isolator, context.envId, scope, workspace),
        plugins: [],
        publicPath: devServerContext.publicPath,
        publicRoot: devServerContext.rootPath,
        pubsub: webpackMain.pubsub,
        rootPath: options.appRootPath,
        setup: BundlerSetup.Serve,
        sourceRoot: options.sourceRoot ?? 'src',
        tempFolder,
        tsConfigPath: tsconfigPath,
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

      assert(options.ngEnvOptions.webpackModulePath, 'ngEnvOptions.webpackModulePath is required to use the Webpack dev server');
      assert(options.ngEnvOptions.webpackDevServerModulePath, 'ngEnvOptions.webpackDevServerModulePath is required to use the Webpack dev server');

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

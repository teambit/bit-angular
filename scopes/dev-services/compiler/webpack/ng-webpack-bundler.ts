import {
  AngularEnvOptions,
  BrowserOptions,
  DevServerOptions,
  getNodeModulesPaths
} from '@teambit/angular-common';
import { AppBuildContext, ApplicationAspect, ApplicationMain } from '@teambit/application';
import { BundlerContext } from '@teambit/bundler';
import { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import {
  GlobalWebpackConfigTransformContext,
  WebpackAspect,
  WebpackBundler,
  WebpackConfigMutator,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer,
  WebpackMain
} from '@teambit/webpack';
import { generateTransformers, runTransformers } from '@teambit/webpack.webpack-bundler';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { join } from 'path';
import { Configuration, WebpackPluginInstance } from 'webpack';
import {
  getPreviewRootPath,
  isAppBuildContext,
  WebpackConfigFactoryOpts,
  WebpackSetup,
  writeTsconfig
} from './utils';
import { StatsLoggerPlugin } from './webpack-plugins/stats-logger';

export type NgWebpackBundlerOptions = {
  angularOptions?: Partial<BrowserOptions & DevServerOptions>;

  /**
   * context of the bundler execution.
   */
  bundlerContext: BundlerContext | (BundlerContext & AppBuildContext);

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

export interface WebpackBuildConfigFactoryOpts {
  outputPath: string,
}

export type WebpackBuildConfigFactory =
  (opts: WebpackConfigFactoryOpts & WebpackBuildConfigFactoryOpts) => Promise<WebpackConfigWithDevServer>;

export class NgWebpackBundler {
  static from(options: NgWebpackBundlerOptions): AsyncEnvHandler<WebpackBundler> {
    return async(context: EnvContext): Promise<WebpackBundler> => {
      if (!options.ngEnvOptions.webpackConfigFactory) {
        throw new Error('ngEnvOptions.webpackConfigFactory is required to use the Webpack bundler');
      }

      const webpackBuildConfigFactory: WebpackBuildConfigFactory = options.ngEnvOptions.webpackConfigFactory;
      const name = options.name || 'ng-webpack-bundler';
      const logger = context.createLogger(name);
      const bundlerContext = options.bundlerContext;
      const workspace = context.getAspect<Workspace>(WorkspaceAspect.id);
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const webpackMain = context.getAspect<WebpackMain>(WebpackAspect.id);

      let tempFolder: string;
      const idName = `teambit.angular/${name}`;
      if (workspace) {
        tempFolder = workspace.getTempDir(idName);
      } else {
        tempFolder = join(CACHE_ROOT, idName);
      }

      let appRootPath: string, tsconfigPath: string;
      let plugins: WebpackPluginInstance[] = [];
      if (isAppBuildContext(bundlerContext)) { // When you use `bit run <app>`
        appRootPath = bundlerContext.capsule.path;// this.workspace?.componentDir(context.appComponent.id, {ignoreScopeAndVersion: true, ignoreVersion: true}) || '';
        tsconfigPath = join(appRootPath, 'tsconfig.app.json');
        plugins = [new StatsLoggerPlugin()];
      } else { // When you use `bit build`
        appRootPath = getPreviewRootPath(workspace);
        tsconfigPath = writeTsconfig(bundlerContext, appRootPath, tempFolder, application, pkg, workspace);
      }

      const transformers = options.transformers || [];
      const transformerContext: GlobalWebpackConfigTransformContext = { mode: 'prod' as const };
      const configs = await Promise.all(bundlerContext.targets.map(async(target) => {
        const finalTransformerContext = { ...transformerContext, target };
        const internalTransformers = generateTransformers(
          logger,
          finalTransformerContext,
          undefined,
          target
        );
        const config = await webpackBuildConfigFactory({
          angularOptions: options.angularOptions ?? {},
          context: bundlerContext,
          entryFiles: target.entries as string[],
          logger,
          useNgcc: !!options.ngEnvOptions.useNgcc,
          nodeModulesPaths: getNodeModulesPaths(false, isolator, workspace),
          plugins,
          rootPath: appRootPath,
          setup: WebpackSetup.Build,
          sourceRoot: options.sourceRoot ?? 'src',
          tempFolder,
          tsConfigPath: tsconfigPath,
          webpackOptions: options.webpackOptions ?? {},
          workspaceDir: workspace?.path ?? '',
          outputPath: target.outputPath
        });

        const configMutator = new WebpackConfigMutator(config);
        const afterMutation = runTransformers(
          configMutator.clone(),
          [...internalTransformers, ...transformers],
          finalTransformerContext
        );
        return afterMutation.raw;
      }));

      if(!options.ngEnvOptions.webpackModulePath) {
        throw new Error('ngEnvOptions.webpackModulePath is required to use the Webpack bundler');
      }

      const webpack = require(options.ngEnvOptions.webpackModulePath);
      return new WebpackBundler(bundlerContext.targets, configs, webpackMain.logger, webpack, bundlerContext.metaData);
    };
  }
}

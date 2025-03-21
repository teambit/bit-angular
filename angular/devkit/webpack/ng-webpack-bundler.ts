import {
  AngularEnvOptions,
  ApplicationOptions,
  BrowserOptions,
  BundlerSetup,
  DevServerOptions,
  getNodeModulesPaths,
  getWorkspace,
  isAppBuildContext,
  writeTsconfig
} from '@bitdev/angular.dev-services.common';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { BundlerContext } from '@teambit/bundler';
import { DevFilesAspect, DevFilesMain } from '@teambit/dev-files';
import { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { CACHE_ROOT } from '@teambit/legacy.constants';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { ScopeAspect, ScopeMain } from '@teambit/scope';
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
import assert from 'assert';
import { join, posix } from 'node:path';
import type { Configuration, WebpackPluginInstance } from 'webpack';
import { WebpackConfigFactoryOpts } from './utils';
import { StatsLoggerPlugin } from './webpack-plugins/stats-logger';

export type NgWebpackBundlerOptions = {
  // @ts-ignore
  angularOptions?: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions>;

  /**
   * context of the bundler execution.
   */
  bundlerContext: BundlerContext;

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
      assert(options.ngEnvOptions.webpackConfigFactory, 'webpackConfigFactory is required to use the Webpack bundler');

      const webpackBuildConfigFactory: WebpackBuildConfigFactory = options.ngEnvOptions.webpackConfigFactory;
      const name = options.name || 'ng-webpack-bundler';
      const logger = context.createLogger(name);
      const { bundlerContext } = options;
      const workspace = getWorkspace(context);
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      const application = context.getAspect<ApplicationMain>(ApplicationAspect.id);
      const isolator = context.getAspect<IsolatorMain>(IsolatorAspect.id);
      const scope = context.getAspect<ScopeMain>(ScopeAspect.id);
      const webpackMain = context.getAspect<WebpackMain>(WebpackAspect.id);
      const devFilesMain = context.getAspect<DevFilesMain>(DevFilesAspect.id);

      let tempFolder: string;
      const idName = `bitdev.angular/${ name }`;
      if (workspace) {
        tempFolder = workspace.getTempDir(idName);
      } else {
        tempFolder = join(CACHE_ROOT, idName);
      }

      let tsconfigPath: string;
      let plugins: WebpackPluginInstance[] = [];
      if (isAppBuildContext(bundlerContext)) { // When you use `bit build` for an actual angular app
        tsconfigPath = options?.angularOptions?.tsConfig ?? posix.join(options.appRootPath, 'tsconfig.app.json');
        plugins = [new StatsLoggerPlugin()];
      } else { // When you use `bit build` for the preview app
        tsconfigPath = await writeTsconfig(bundlerContext, options.appRootPath, tempFolder, application, pkg, devFilesMain, options?.angularOptions?.tsConfig, workspace);
        if (options?.angularOptions?.tsConfig) {
          // eslint-disable-next-line no-param-reassign
          options.angularOptions.tsConfig = tsconfigPath;
        }
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
          // keep first argument to be false, to avoid issues when building apps
          nodeModulesPaths: getNodeModulesPaths(false, isolator, context.envId, scope, workspace),
          plugins,
          rootPath: options.appRootPath,
          setup: BundlerSetup.Build,
          sourceRoot: options.sourceRoot ?? 'src',
          tempFolder,
          tsConfigPath: tsconfigPath,
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

      assert(options.ngEnvOptions.webpackModulePath, 'webpackModulePath is required to use the Webpack bundler');

      // eslint-disable-next-line import/no-dynamic-require,global-require
      const webpack = require(options.ngEnvOptions.webpackModulePath);
      return new WebpackBundler(bundlerContext.targets, configs, webpackMain.logger, webpack, bundlerContext.metaData);
    };
  }
}

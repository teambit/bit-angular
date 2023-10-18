import { BitDedupeModuleResolvePlugin, StatsLoggerPlugin } from '@bitdev/angular.dev-services.webpack';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { PubsubMain } from '@teambit/pubsub';
import {
  fallbacks,
  fallbacksAliases,
  fallbacksProvidePluginConfig,
  WebpackBitReporterPlugin,
  WebpackConfigWithDevServer
} from '@teambit/webpack';
import { join, posix, resolve } from 'path';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import evalSourceMapMiddleware from 'react-dev-utils/evalSourceMapMiddleware';
import getPublicUrlOrPath from 'react-dev-utils/getPublicUrlOrPath';
import noopServiceWorkerMiddleware from 'react-dev-utils/noopServiceWorkerMiddleware';
import redirectServedPath from 'react-dev-utils/redirectServedPathMiddleware';
import { ProvidePlugin } from 'webpack';
import { getModuleRulesConfig } from './module-rules.config';

const publicUrlOrPath = getPublicUrlOrPath(process.env.NODE_ENV === 'development', '/', '/public');

export function webpack5ServeConfigFactory(
  devServerID: string,
  workspaceDir: string,
  entryFiles: string[],
  publicRoot: string,
  publicPath: string,
  pubsub: PubsubMain,
  nodeModulesPaths: string[],
  tempFolder: string,
  plugins: any[] = [],
  isApp = false,
): WebpackConfigWithDevServer {
  const resolveWorkspacePath = (relativePath: string) => resolve(workspaceDir, relativePath);

  // Host
  const host = process.env.HOST || 'localhost';

  // Required for babel-preset-react-app
  process.env.NODE_ENV = 'development';

  const publicDirectory = posix.join(publicRoot, publicPath);

  if (isApp) {
    plugins.push(new StatsLoggerPlugin() as any);
  }

  const config = {
    // Environment mode
    mode: 'development',

    devtool: 'inline-source-map',

    // Entry point of app
    entry: entryFiles.map((filePath) => resolveWorkspacePath(filePath)),

    output: {
      // Development filename output
      filename: 'static/js/[name].bundle.js',

      pathinfo: true,

      path: resolveWorkspacePath(publicDirectory),

      chunkFilename: 'static/js/[name].chunk.js',

      // point sourcemap entries to original disk locations (format as URL on windows)
      devtoolModuleFilenameTemplate: (info: any) => pathNormalizeToLinux(resolve(info.absoluteResourcePath))

      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      // Commented out to use the default (self) as according to tobias with webpack5 self is working with workers as well
      // globalObject: 'this',
    },

    infrastructureLogging: {
      level: 'error'
    },

    stats: 'errors-only',

    // @ts-ignore until types are updated with new options from webpack-dev-server v4
    devServer: {
      static: [
        {
          directory: resolveWorkspacePath(publicDirectory),
          staticOptions: {},
          // Don't be confused with `dev.publicPath`, it is `publicPath` for static directory
          // Can be:
          // publicPath: ['/static-public-path-one/', '/static-public-path-two/'],
          publicPath: publicDirectory,
          // Can be:
          // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
          serveIndex: true,
          // Can be:
          // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
          watch: false
        }
      ],

      // Enable compression
      compress: true,

      // Enable hot reloading
      hot: false,

      liveReload: true,

      host,

      historyApiFallback: {
        disableDotRule: true,
        index: resolveWorkspacePath(publicDirectory)
      },

      client: {
        overlay: false
      },

      webSocketServer: {
        options: {
          path: `/_hmr/${devServerID}`
          // port automatically matches WDS
        }
      },

      onBeforeSetupMiddleware(devServer: any) {
        // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
        // middlewares before `redirectServedPath` otherwise will not have any effect
        // This lets us fetch source contents from webpack for the error overlay
        devServer.app.use(evalSourceMapMiddleware(devServer));
        // This lets us open files from the runtime error overlay.
        devServer.app.use(errorOverlayMiddleware());
      },

      onAfterSetupMiddleware(devServer: any) {
        // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
        devServer.app.use(redirectServedPath(publicUrlOrPath));

        // This service worker file is effectively a 'no-op' that will reset any
        // previous service worker registered for the same host:port combination.
        // We do this in development to avoid hitting the production cache if
        // it used the same host and port.
        // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
        devServer.app.use(noopServiceWorkerMiddleware(publicUrlOrPath));
      },

      devMiddleware: {
        // Public path is root of content base
        publicPath: join('/', publicRoot)
      }
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.mdx', '.md'],
      alias: fallbacksAliases,
      fallback: { ...fallbacks, events: require.resolve('events/') } as any,
      modules: nodeModulesPaths
    },

    module: {
      rules: getModuleRulesConfig(false)
    },

    plugins: [
      new BitDedupeModuleResolvePlugin(nodeModulesPaths, workspaceDir, tempFolder),
      new ProvidePlugin(fallbacksProvidePluginConfig),
      new WebpackBitReporterPlugin({
        options: { pubsub, devServerID }
      }),
      ...plugins
    ]
  };

  return config as WebpackConfigWithDevServer;
}

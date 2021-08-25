import { AngularModulesResolverPlugin, BitAngularPlugin } from '@teambit/angular';
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
import RemarkAutolink from 'remark-autolink-headings';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';
import { ProvidePlugin } from 'webpack';

const clientHost = process.env.WDS_SOCKET_HOST;
const clientPath = process.env.WDS_SOCKET_PATH; // default is '/sockjs-node';
const port = process.env.WDS_SOCKET_PORT;

const publicUrlOrPath = getPublicUrlOrPath(process.env.NODE_ENV === 'development', '/', '/public');

export function webpack5ServeConfigFactory(
  devServerID: string,
  workspaceDir: string,
  entryFiles: string[],
  publicRoot: string,
  publicPath: string,
  pubsub: PubsubMain,
  nodeModulesPaths: string[],
  tsConfigPath: string,
): WebpackConfigWithDevServer {
  const resolveWorkspacePath = (relativePath: string) => resolve(workspaceDir, relativePath);

  // Host
  const host = process.env.HOST || 'localhost';

  // Required for babel-preset-react-app
  process.env.NODE_ENV = 'development';

  const publicDirectory = posix.join(publicRoot, publicPath);

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
      devtoolModuleFilenameTemplate: (info) => pathNormalizeToLinux(resolve(info.absoluteResourcePath)),

      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      // Commented out to use the default (self) as according to tobias with webpack5 self is working with workers as well
      // globalObject: 'this',
    },

    infrastructureLogging: {
      level: 'error',
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
          watch: true,
        },
      ],

      // Enable compression
      compress: true,

      // Use 'ws' instead of 'sockjs-node' on server since we're using native
      // websockets in `webpackHotDevClient`.
      transportMode: 'ws',

      // Enable hot reloading
      hot: false,

      liveReload: true,

      host,

      historyApiFallback: {
        disableDotRule: true,
        index: resolveWorkspacePath(publicDirectory),
      },

      client: {
        needClientEntry: false,
        overlay: false,
        host: clientHost,
        path: clientPath,
        port,
      },

      onBeforeSetupMiddleware(app, server) {
        // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
        // middlewares before `redirectServedPath` otherwise will not have any effect
        // This lets us fetch source contents from webpack for the error overlay
        app.use(evalSourceMapMiddleware(server));
        // This lets us open files from the runtime error overlay.
        app.use(errorOverlayMiddleware());
      },

      onAfterSetupMiddleware(app) {
        // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
        app.use(redirectServedPath(publicUrlOrPath));

        // This service worker file is effectively a 'no-op' that will reset any
        // previous service worker registered for the same host:port combination.
        // We do this in development to avoid hitting the production cache if
        // it used the same host and port.
        // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
        app.use(noopServiceWorkerMiddleware(publicUrlOrPath));
      },

      dev: {
        // Public path is root of content base
        publicPath: join('/', publicRoot),
      },
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.mdx', '.md'],
      alias: fallbacksAliases,
      fallback: { ...fallbacks, events: require.resolve('events/') } as any,
      plugins: [new AngularModulesResolverPlugin(nodeModulesPaths)]
    },

    module: {
      rules: [
        {
          test: /\.md$/,
          use: [
            {
              loader: 'html-loader',
            },
            {
              loader: 'remark-loader',
              options: {
                removeFrontMatter: false,
                remarkOptions: {
                  plugins: [RemarkPrism, RemarkAutolink, RemarkHTML, RemarkFrontmatter],
                },
              },
            },
          ],
        },
      ],
    },

    plugins: [
      new BitAngularPlugin(tsConfigPath, nodeModulesPaths),
      new ProvidePlugin(fallbacksProvidePluginConfig),
      new WebpackBitReporterPlugin({
        options: { pubsub, devServerID },
      }),
    ],
  };

  return config as WebpackConfigWithDevServer;
}

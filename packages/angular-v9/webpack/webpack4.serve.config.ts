import { AngularModulesResolverPlugin, BitAngularPlugin } from '@teambit/angular';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { PubsubMain } from '@teambit/pubsub';
import {
  fallbacksAliases,
  WebpackBitReporterPlugin,
  WebpackConfigWithDevServer
} from '@teambit/webpack';
import path from 'path';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import evalSourceMapMiddleware from 'react-dev-utils/evalSourceMapMiddleware';
import getPublicUrlOrPath from 'react-dev-utils/getPublicUrlOrPath';
import noopServiceWorkerMiddleware from 'react-dev-utils/noopServiceWorkerMiddleware';
import redirectServedPath from 'react-dev-utils/redirectServedPathMiddleware';
import RemarkAutolink from 'remark-autolink-headings';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';

const sockHost = process.env.WDS_SOCKET_HOST;
const sockPath = process.env.WDS_SOCKET_PATH; // default: '/sockjs-node'
const sockPort = process.env.WDS_SOCKET_PORT;

const publicUrlOrPath = getPublicUrlOrPath(process.env.NODE_ENV === 'development', '/', '/public');

export function webpack4ServeConfigFactory(
  devServerID: string,
  workspaceDir: string,
  entryFiles: string[],
  publicRoot: string,
  publicPath: string,
  pubsub: PubsubMain,
  nodeModulesPaths: string[],
  tsConfigPath: string,
): WebpackConfigWithDevServer {
  const resolveWorkspacePath = (relativePath: string) => path.resolve(workspaceDir, relativePath);

  // Host
  const host = process.env.HOST || 'localhost';

  // Required for babel-preset-react-app
  process.env.NODE_ENV = 'development';

  const publicDirectory = path.posix.join(publicRoot, publicPath);

  return {
    // Environment mode
    mode: 'development',

    devtool: 'inline-source-map',

    // Entry point of app
    entry: entryFiles.map((filePath) => resolveWorkspacePath(filePath)),

    node: {
      // @ts-ignore
      fs: 'empty',
    },

    output: {
      // Development filename output
      filename: 'static/js/[name].bundle.js',

      pathinfo: true,

      path: resolveWorkspacePath(publicDirectory),

      // publicPath: `/${publicRoot}/`,

      // @ts-ignore
      futureEmitAssets: true,

      chunkFilename: 'static/js/[name].chunk.js',

      // point sourcemap entries to original disk locations (format as URL on windows)
      devtoolModuleFilenameTemplate: (info) => pathNormalizeToLinux(path.resolve(info.absoluteResourcePath)),

      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      globalObject: 'this',
    },

    devServer: {
      quiet: true,
      stats: 'errors-only',

      // Serve index.html as the base
      contentBase: resolveWorkspacePath(publicDirectory),

      // By default files from `contentBase` will not trigger a page reload.
      watchContentBase: false,

      contentBasePublicPath: publicDirectory,

      // Enable compression
      compress: true,

      // Use 'ws' instead of
      // 'sockjs-node' on server since we're using native
      // websockets in `webpackHotDevClient`.
      transportMode: 'ws',

      injectClient: false,

      overlay: false,
      // Enable hot reloading
      hot: false,

      host,

      historyApiFallback: {
        disableDotRule: true,
        index: resolveWorkspacePath(publicDirectory),
      },

      sockHost,
      sockPath,
      sockPort,

      before(app, server) {
        // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
        // middlewares before `redirectServedPath` otherwise will not have any effect
        // This lets us fetch source contents from webpack for the error overlay
        app.use(evalSourceMapMiddleware(server));
        // This lets us open files from the runtime error overlay.
        app.use(errorOverlayMiddleware());
      },

      after(app) {
        // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
        app.use(redirectServedPath(publicUrlOrPath));

        // This service worker file is effectively a 'no-op' that will reset any
        // previous service worker registered for the same host:port combination.
        // We do this in development to avoid hitting the production cache if
        // it used the same host and port.
        // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
        app.use(noopServiceWorkerMiddleware(publicUrlOrPath));
      },

      // Public path is root of content base
      publicPath: path.join('/', publicRoot),
    },

    resolve: {
      extensions: ['.mjs', '.ts', '.tsx', '.js', '.mdx', '.md'],
      alias: {
        ...fallbacksAliases,
        path: require.resolve('path-browserify')
      },
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
      new WebpackBitReporterPlugin({
        options: { pubsub, devServerID },
      }),
    ],
  };
}

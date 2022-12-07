import {
  AngularEnvOptions,
  BitDedupeModuleResolvePlugin,
  WebpackConfig,
  WebpackPlugin
} from '@teambit/angular-base';
import { sep } from 'path';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';

// TODO(ocombe): this is webpack 5 build config, not webpack 4
export function webpack4BuildConfigFactory(
  entryFiles: string[],
  outputPath: string,
  nodeModulesPaths: string[],
  workspaceDir: string,
  tempFolder: string,
  plugins: WebpackPlugin[] = [],
  ngEnvOptions: AngularEnvOptions,
): WebpackConfig {
  const config = {
    mode: 'production',
    // Stop compilation early in production
    bail: true,
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: entryFiles,

    node: {
      // @ts-ignore
      fs: 'empty',
    },

    output: {
      // The build folder.
      path: `${outputPath}${sep}public`,

      // publicPath: ``,

      // @ts-ignore
      futureEmitAssets: true,

      filename: 'static/js/[name].[contenthash:8].js',

      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',

      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      globalObject: 'this',
    },

    resolve: {
      extensions: ['.mjs', '.ts', '.tsx', '.js', '.mdx', '.md'],
      alias: {
        path: require.resolve('path-browserify'),
      },
      modules: nodeModulesPaths
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
                  plugins: [RemarkPrism, RemarkHTML, RemarkFrontmatter],
                },
              },
            },
          ],
        },
      ],
    },

    plugins:[
      new BitDedupeModuleResolvePlugin(nodeModulesPaths, workspaceDir, tempFolder, ngEnvOptions),
      ...plugins
    ]
  };

  return config as WebpackConfig;
}

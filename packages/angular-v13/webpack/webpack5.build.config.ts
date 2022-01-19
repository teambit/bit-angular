import { BitDedupeModuleResolvePlugin } from '@teambit/angular';
import { fallbacks, fallbacksAliases, fallbacksProvidePluginConfig } from '@teambit/webpack';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';
import webpack, { Configuration } from 'webpack';

export function webpack5BuildConfigFactory(
  entryFiles: string[],
  rootPath: string,
  nodeModulesPaths: string[],
  workspaceDir: string,
  tempFolder: string
): Configuration {
  const config = {
    mode: 'production',
    // Stop compilation early in production
    bail: true,
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: entryFiles.filter(Boolean),

    output: {
      // The build folder.
      path: `${rootPath}/public`,

      filename: 'static/js/[name].[contenthash:8].js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: ``,
      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      // Commented out to use the default (self) as according to tobias with webpack5 self is working with workers as well
      // globalObject: 'this',
    },

    resolve: {
      alias: fallbacksAliases,
      fallback: fallbacks,
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

    plugins: [
      new BitDedupeModuleResolvePlugin(nodeModulesPaths, workspaceDir, tempFolder),
      new webpack.ProvidePlugin(fallbacksProvidePluginConfig),
    ],
  };

  return config as Configuration;
}

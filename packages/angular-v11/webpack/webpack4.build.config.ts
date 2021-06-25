import webpack, { Configuration } from 'webpack';
import { fallbacks } from '@teambit/webpack';
import RemarkAutolink from 'remark-autolink-headings';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';

// TODO(ocombe): this is webpack 5 build config, not webpack 4
export function webpack4BuildConfigFactory(entryFiles: string[], rootPath: string): Configuration {
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
      alias: {
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer/'),
      },

      // @ts-ignore
      fallback: fallbacks,
    },

    module: {
      rules: [
        {
          test: /\.md$/,
          use: [
            {
              loader: "html-loader",
            },
            {
              loader: "remark-loader",
              options: {
                removeFrontMatter: false,
                remarkOptions: {
                  plugins: [RemarkPrism, RemarkAutolink, RemarkHTML, RemarkFrontmatter],
                },
              }
            },
          ]
        }
      ]
    },

    plugins: [
      // new HtmlWebpackPlugin(
      //   Object.assign(
      //     {},
      //     {
      //       inject: true,
      //       templateContent: html('Preview'),
      //     },
      //     {
      //       minify: {
      //         removeComments: true,
      //         collapseWhitespace: true,
      //         removeRedundantAttributes: true,
      //         useShortDoctype: true,
      //         removeEmptyAttributes: true,
      //         removeStyleLinkTypeAttributes: true,
      //         keepClosingSlash: true,
      //         minifyJS: true,
      //         minifyCSS: true,
      //         minifyURLs: true,
      //       },
      //     }
      //   )
      // ),
      new webpack.ProvidePlugin({
        process: require.resolve('process/browser'),
        Buffer: [require.resolve('buffer/'), 'Buffer'],
      }),
    ],
  };

  return config as Configuration;
}
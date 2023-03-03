import { BitDedupeModuleResolvePlugin, WebpackConfig } from '@teambit/angular-webpack';
import { fallbacks, fallbacksAliases, fallbacksProvidePluginConfig } from '@teambit/webpack';
import { sep } from 'path';
import webpack from 'webpack';
import { getModuleRulesConfig } from './module-rules.config';

export function webpack5BuildConfigFactory(
  entryFiles: string[],
  outputPath: string,
  nodeModulesPaths: string[],
  workspaceDir: string,
  tempFolder: string,
  plugins: any[] = [],
  useNgcc: boolean,
): WebpackConfig {
  const config = {
    mode: 'production',
    // Stop compilation early in production
    bail: true,
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: entryFiles,

    output: {
      // The build folder.
      path: `${outputPath}${sep}public`,

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
      rules: getModuleRulesConfig(true),
    },

    plugins: [
      new BitDedupeModuleResolvePlugin(nodeModulesPaths, workspaceDir, tempFolder, useNgcc),
      new webpack.ProvidePlugin(fallbacksProvidePluginConfig),
      ...plugins
    ],
  };

  return config as WebpackConfig;
}

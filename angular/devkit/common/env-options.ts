import { WebpackConfigWithDevServer } from '@teambit/webpack';

export type WebpackConfigFactory = (opts: any) => Promise<WebpackConfigWithDevServer>;

export type AngularEnvOptions = {
  /**
   * Use Rollup & Angular Elements to compile compositions instead of webpack.
   * This transforms compositions into Web Components and replaces the Angular bundler by the React bundler.
   */
  useAngularElementsPreview?: boolean;
  jestModulePath: string;
  ngPackagrModulePath: string;
  angularElementsModulePath?: string;
  webpackConfigFactory?: WebpackConfigFactory;
  webpackDevServerModulePath?: string;
  webpackModulePath?: string;
  /**
   * The dev server to use: webpack or vite.
   * Vite only works for apps, not preview yet.
   * @default 'webpack'
   */
  // devServer?: 'webpack' | 'vite';
  /**
   * The bundler to use: webpack or vite.
   * Vite only works for apps, not preview yet.
   * @default 'webpack'
   */
  // TODO: enable this once we have a working vite bundler
  // bundler?: 'webpack' | 'vite';
};

import { WebpackConfigWithDevServer } from "@teambit/webpack";

export type WebpackConfigFactory = (opts: any) => Promise<WebpackConfigWithDevServer>;

export type AngularEnvOptions = {

  /**
   * Use Rollup & Angular Elements to compile compositions instead of webpack.
   * This transforms compositions into Web Components and replaces the Angular bundler by the React bundler.
   */
  useAngularElementsPreview?: boolean;

  /**
   * Whether ngcc should be run as part of postinstall / compile / build ...
   */
  useNgcc?: boolean;

  jestConfigPath: string;
  jestModulePath: string;
  ngPackagrModulePath: string;
  readDefaultTsConfig: string;
  angularElementsModulePath?: string;
  webpackConfigFactory?: WebpackConfigFactory;
  webpackDevServerModulePath?: string;
  webpackModulePath?: string;
};

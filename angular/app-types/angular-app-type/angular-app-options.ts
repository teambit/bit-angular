import {
  ApplicationOptions,
  BrowserOptions,
  DevServerOptions
} from '@bitdev/angular.dev-services.common';
import { Bundler } from '@teambit/bundler';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { AngularDeployContext } from './deploy-context';

export type AngularAppOptions = {
  /**
   * Name of the application.
   */
  name: string;

  /**
   * The root of the source files, assets and index.html file structure.
   */
  sourceRoot: string;

  /**
   * Instance of bundler to use, default is esbuild after v17 and webpack before that.
   */
  bundler?: Bundler;

  /**
   * Set webpack build transformers
   */
  webpackBuildTransformers?: WebpackConfigTransformer[];

  /**
   * Set webpack serve transformers
   */
  webpackServeTransformers?: WebpackConfigTransformer[];

  /**
   * Deploy function.
   */
  deploy?: (context: AngularDeployContext) => Promise<void>;

  /**
   * Ranges of ports to use to run the app server.
   */
  portRange?: number[];

  /**
   * Angular options for `bit build`
   */
  angularBuildOptions: BrowserOptions | ApplicationOptions;

  /**
   * Angular options for `bit run`
   */
  angularServeOptions: (BrowserOptions & DevServerOptions) | (ApplicationOptions & DevServerOptions);
};

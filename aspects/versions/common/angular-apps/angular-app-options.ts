import { Bundler } from '@teambit/bundler';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { BrowserOptions, DevServerOptions } from './generic-angular-env';
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
   * Instance of bundler to use. default is Webpack.
   */
  bundler?: Bundler;

  /**
   * Set webpack transformers
   */
  webpackTransformers?: WebpackConfigTransformer[];

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
  angularBuildOptions: BrowserOptions;

  /**
   * Angular options for `bit run`
   */
  angularServeOptions: BrowserOptions & DevServerOptions;
};

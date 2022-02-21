import { Bundler, DevServer } from '@teambit/bundler';
import { WebpackConfigTransformer } from '@teambit/webpack';

import { AngularDeployContext } from './deploy-context';

export type AngularAppOptions = {
  /**
   * name of the application.
   */
  name: string;

  /**
   * instance of bundler to use. default is Webpack.
   */
  bundler?: Bundler;

  /**
   * set webpack transformers
   */
  webpackTransformers?: WebpackConfigTransformer[];

  /**
   * deploy function.
   */
  deploy?: (context: AngularDeployContext) => Promise<void>;

  /**
   * ranges of ports to use to run the app server.
   */
  portRange?: number[];
};

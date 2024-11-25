import { type AngularAppOptions, AngularApp } from '@bitdev/angular.app-types.angular-app-type';
import type { ApplicationOptions, DevServerOptions } from '@bitdev/angular.dev-services.common';
import { ngEnvOptions } from '@bitdev/angular.angular-env';

const angularOptions: ApplicationOptions & DevServerOptions = {
  browser: './src/main.ts',
  server: './src/main.server.ts',
  index: './src/index.html',
  tsConfig: 'tsconfig.app.json',
  assets: ['./src/favicon.ico', './src/assets'],
  styles: ['./src/styles.scss'],
  inlineStyleLanguage: "scss",
  prerender: true,
  outputMode: "server",
  ssr: {
    "entry": "./src/server.ts"
  }
};

export const DemoAppOptions: AngularAppOptions = {
  /**
   * Name of the app in Bit CLI.
   */
  name: 'demo-app',

  /**
   * The root of the source files, assets and index.html file structure.
   */
  sourceRoot: 'src',

  /**
   * Angular options for `bit build`
   */
  angularBuildOptions: angularOptions,

  /**
   * Angular options for `bit run`
   */
  angularServeOptions: angularOptions,

  /**
   * Env-specific options depending on the version of Angular used.
   */
  ngEnvOptions
};

export default AngularApp.from(DemoAppOptions);

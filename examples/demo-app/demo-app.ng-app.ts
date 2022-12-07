import { AngularAppOptions, BrowserOptions, DevServerOptions } from '@teambit/angular-apps';

const angularOptions: BrowserOptions & DevServerOptions = {
  main: './src/main.ts',
  polyfills: './src/polyfills.ts',
  index: './src/index.html',
  tsConfig: 'tsconfig.app.json',
  assets: ['./src/favicon.ico', './src/assets'],
  styles: ['./src/styles.scss'],
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

};

export default DemoAppOptions;

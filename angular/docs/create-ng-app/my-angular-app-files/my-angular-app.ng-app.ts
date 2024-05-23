export default `import { AngularAppOptions } from '@bitdev/angular.app-types.angular-app-type';
import { BrowserOptions, DevServerOptions } from '@bitdev/angular.dev-services.common';

const angularOptions: BrowserOptions & DevServerOptions = {
  main: './src/main.ts',
  polyfills: './src/polyfills.ts',
  index: './src/index.html',
  tsConfig: './tsconfig.app.json',
  assets: ['./src/assets/**/*'],
  styles: ['./src/styles.scss'],
};

export const MyAngularAppOptions: AngularAppOptions = {
  /**
   * Name of the app in Bit CLI.
   */
  name: 'my-angular-app',

  /**
   * Angular options for \`bit build\`
   */
  angularBuildOptions: angularOptions,

  /**
   * Angular options for \`bit run\`
   */
  angularServeOptions: angularOptions,

  /**
    * Folder containing the main file of your application
    */
  sourceRoot: './src',
};

export default MyAngularAppOptions;`;

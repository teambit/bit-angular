import { ComponentContext, ComponentFile } from '@teambit/generator';

export const ngAppFile = (context: ComponentContext, styleSheet: string, ssr: boolean, angularVersion: number): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `${name}.bit-app.ts`,
    isMain: true,
    content: `import { type AngularAppOptions, AngularApp } from '@bitdev/angular.app-types.angular-app-type';
import { ${ssr ? `ApplicationOptions`: `BrowserOptions` }, DevServerOptions } from '@bitdev/angular.dev-services.common';

const angularOptions: ${ssr ? `ApplicationOptions`: `BrowserOptions` } & DevServerOptions = {
  ${ssr ? `browser: './src/main.ts',
  server: './src/main.server.ts',
  prerender: true,
  ${angularVersion >= 19 ? `outputMode: "static",
  ssr: {"entry": "./src/server.ts"}` : 'ssr: true'}` : `main: './src/main.ts'`},
  index: './src/index.html',
  tsConfig: './tsconfig.app.json',
  inlineStyleLanguage: '${styleSheet}',
  assets: [{
    "glob": "**/*",
    "input": "src/assets/",
    "output": "/assets/"
  }],
  styles: ['./src/styles.${styleSheet}'],
};

export const ${Name}Options: AngularAppOptions = {
  /**
   * Name of the app in Bit CLI.
   */
  name: '${name}',

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

export default AngularApp.from(${Name}Options);
`,
  };
};

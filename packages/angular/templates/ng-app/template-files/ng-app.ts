import { ComponentContext, ComponentFile } from '@teambit/generator';

export const ngAppFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `${name}.ng-app.ts`,
    content: `import { AngularAppOptions, BrowserOptions, DevServerOptions } from '@teambit/angular';

const angularOptions: BrowserOptions & DevServerOptions = {
  main: 'src/main.ts',
  polyfills: 'src/polyfills.ts',
  index: 'src/index.html',
  tsConfig: 'tsconfig.app.json',
  assets: ['src/favicon.ico', 'src/assets'],
  styles: ['src/styles.scss'],
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
  angularServeOptions: angularOptions
};

export default ${Name}Options;
`,
  };
};

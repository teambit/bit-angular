import { ComponentContext, ComponentFile } from '@teambit/generator';

export const ngAppFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `${name}.ng-app.ts`,
    content: `import { AngularAppOptions } from '@teambit/angular';

export const ${Name}Options: AngularAppOptions = {
  /**
   * Name of the app in Bit CLI.
   */
  name: '${name}'
};

export default ${Name}Options;
`,
  };
};

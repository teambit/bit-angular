import { ComponentContext, ComponentFile } from '@teambit/generator';

export const environmentProdFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `src/environments/environment.prod.ts`,
    content: `export const environment = {
  production: true
};
`,
  };
};

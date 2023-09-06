import { ComponentContext, ComponentFile } from '@teambit/generator';

export const environmentProdFile = (context: ComponentContext): ComponentFile => {
  return {
    relativePath: `src/environments/environment.prod.ts`,
    content: `export const environment = {
  production: true
};
`,
  };
};

import { ComponentFile } from '@teambit/generator';

export const environmentProdFile = (): ComponentFile => {
  return {
    relativePath: `src/environments/environment.prod.ts`,
    content: `export const environment = {
  production: true
};
`,
  };
};

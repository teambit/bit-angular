import { ComponentContext, ComponentFile } from '@teambit/generator';

export const indexFile = (context: ComponentContext): ComponentFile => {
  const { name } = context;
  return {
    relativePath: `index.ts`,
    isMain: true,
    content: `export * from './${name}.bit-app';`
  };
};

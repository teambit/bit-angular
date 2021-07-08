import { ComponentContext, ComponentFile } from '@teambit/generator';

export const publicApiFile = (context: ComponentContext): ComponentFile => {
  const { name } = context;
  return {
    isMain: true,
    relativePath: 'public-api.ts',
    content: `/**
 * Entry point for this Angular library, do not move or rename this file.
 */
export * from './src/${name}.component';
export * from './src/${name}.module';
`,
  };
};

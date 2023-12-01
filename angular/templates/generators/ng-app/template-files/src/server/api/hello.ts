import { ComponentFile } from '@teambit/generator';

export const helloApiFile = (): ComponentFile => {
  return {
    relativePath: `src/server/api/hello.ts`,
    content: `import { defineEventHandler } from 'h3';

export default defineEventHandler(() => ({ message: 'Hello World' }));`,
  };
};

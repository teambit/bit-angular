import { ComponentFile } from '@teambit/generator';

export const gitKeepFile = (): ComponentFile => {
  return {
    relativePath: `src/assets/.gitkeep`,
    content: ``,
  };
};

import { ComponentContext, ComponentFile } from '@teambit/generator';

export const gitKeepFile = (context: ComponentContext): ComponentFile => {
  return {
    relativePath: `src/assets/.gitkeep`,
    content: ``,
  };
};

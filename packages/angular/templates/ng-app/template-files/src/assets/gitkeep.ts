import { ComponentContext, ComponentFile } from '@teambit/generator';

export const gitKeepFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `src/assets/.gitkeep`,
    content: ``,
  };
};

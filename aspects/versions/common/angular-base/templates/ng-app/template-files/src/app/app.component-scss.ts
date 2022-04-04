import { ComponentContext, ComponentFile } from '@teambit/generator';

export const appComponentScssFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `src/app/app.component.scss`,
    content: ``,
  };
};

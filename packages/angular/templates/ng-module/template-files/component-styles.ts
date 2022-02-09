import { ComponentContext, ComponentFile } from '@teambit/generator';

export const componentStylesFile = (context: ComponentContext): ComponentFile => {
  const { name } = context;
  return {
    relativePath: `${name}.component.scss`,
    content: `:host {
  font-size: inherit;
}`,
  };
};

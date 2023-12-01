import { ComponentFile } from '@teambit/generator';

export const appComponentStyleSheetFile = (styleSheet: string): ComponentFile => {
  return {
    relativePath: `src/app/app.component.${styleSheet}`,
    content: ``,
  };
};

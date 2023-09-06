import { ComponentContext, ComponentFile } from '@teambit/generator';

export const stylesFile = (context: ComponentContext): ComponentFile => {
  return {
    relativePath: `src/styles.scss`,
    content: `/* You can add global styles to this file, and also import other style files */
`,
  };
};

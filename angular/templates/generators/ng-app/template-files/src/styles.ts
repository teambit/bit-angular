import { ComponentFile } from '@teambit/generator';

export const stylesFile = (styleSheet: string): ComponentFile => {
  return {
    relativePath: `src/styles.${styleSheet}`,
    content: `/* You can add global styles to this file, and also import other style files */
`,
  };
};

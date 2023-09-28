import { ComponentFile } from '@teambit/generator';

export const stylesFile = (): ComponentFile => {
  return {
    relativePath: `src/styles.scss`,
    content: `/* You can add global styles to this file, and also import other style files */
`,
  };
};

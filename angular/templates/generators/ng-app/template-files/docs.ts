import { ComponentContext, ComponentFile } from '@teambit/generator';

export const docsFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `${name}.docs.md`,
    content: `---
labels: ['angular', 'typescript', 'apps']
description: 'An Angular application.'
---

Run your application with \`bit run ${name}\`.
`,
  };
};

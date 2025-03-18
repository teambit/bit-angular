import { ComponentContext, ComponentFile } from '@teambit/generator';

export const docsFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `${name}.docs.md`,
    content: `---
labels: ['angular', 'typescript', '${name}']
description: 'A \`${name}\` component.'
---

Import \`${Name}Component\` into your application and use the returned selector to create a component
in the framework of your choice. For example with react:

\`\`\`ts
import { ${Name}Component } from '@my-scope/${name}';
import type { ReactNode } from 'react';

export type ${Name}Props = {
  /**
   * sets the component children.
   */
  children?: ReactNode;
};

// Use the component:
export function ${Name}({ children }: ${Name}Props) {
  return (
    <${Name}Component>
      {children}
    </${Name}Component>
  );
}

\`\`\`
`,
  };
};

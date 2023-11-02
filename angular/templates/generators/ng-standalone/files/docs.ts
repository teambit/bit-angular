import { ComponentContext, ComponentFile } from '@teambit/generator';

export const docsFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `${name}.docs.md`,
    content: `---
labels: ['angular', 'typescript', '${name}']
description: 'A \`${name}\` component.'
---

Import \`${Name}Component\` into your application:

\`\`\`ts
import { ${Name}Component } from './${name}.component';

// add it to your component imports
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ${Name}Component
  ]
})
export class AppComponent {}
\`\`\`

Use \`${Name}Component\` in your generators:

\`\`\`html
<${name}></${name}>
\`\`\`
`,
  };
};

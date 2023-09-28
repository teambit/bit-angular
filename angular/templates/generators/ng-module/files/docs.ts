import { ComponentContext, ComponentFile } from '@teambit/generator';

export const docsFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `${name}.docs.md`,
    content: `---
labels: ['angular', 'typescript', '${name}']
description: 'A \`${name}\` component.'
---

# ${Name} documentation

Import \`${Name}Module\` into your application:

\`\`\`ts
import { ${Name}Module } from './${name}.module';

// add it to your module imports
@NgModule({
  imports: [
    ${Name}Module
  ]
})
export class AppModule {}
\`\`\`

Use \`${Name}Component\` in your generators:

\`\`\`html
<${name}></${name}>
\`\`\`
`,
  };
};

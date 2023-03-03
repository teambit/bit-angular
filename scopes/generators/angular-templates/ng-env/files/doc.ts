import { ComponentContext } from '@teambit/generator';

export function docFile({ namePascalCase: Name }: ComponentContext) {
  // language=Markdown
  return `---
labels: ['extension', 'angular', 'env', 'environment']
description: 'A customized Angular environment.'
---

This is a customized Angular environment, based on the default ${Name}.

Explain here the modified configurations and tools applied.
`;
}

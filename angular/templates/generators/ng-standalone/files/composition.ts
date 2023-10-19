import { ComponentContext, ComponentFile } from '@teambit/generator';

export const compositionFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  const standaloneComposition = `import { Component } from '@angular/core';
import { ${Name}Component } from './${name}.component';

@Component({
  standalone: true,
  selector: '${name}-composition-cmp',
  imports: [${Name}Component],
  template: \`${Name} composition: <${name}></${name}>\`
})
export class ${Name}CompositionComponent {}
`;

  return {
    relativePath: `${name}.composition.ts`,
    content: standaloneComposition,
  };
};

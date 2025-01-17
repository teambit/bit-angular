import { ComponentContext, ComponentFile } from '@teambit/generator';

export const compositionFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `${name}.composition.ts`,
    content: `import { Component } from '@angular/core';
import { ${Name}Module } from './${name}.module';

@Component({
  standalone: true,
  selector: '${name}-composition-cmp',
  imports: [${Name}Module],
  template: \`${Name} composition: <${name}></${name}>\`
})
export class ${Name}CompositionComponent {}`,
  };
};

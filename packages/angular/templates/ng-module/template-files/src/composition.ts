import { ComponentContext, ComponentFile } from '@teambit/generator';

export const compositionFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `src/${name}.composition.ts`,
    content: `import { Component, NgModule } from '@angular/core';
import { ${Name}Module } from './${name}.module';

@Component({
  selector: '${name}-composition-cmp',
  template: \`${Name} composition: <${name}></${name}>\`
})
class ${Name}CompositionComponent {}

@NgModule({
  declarations: [${Name}CompositionComponent],
  imports: [${Name}Module],
  bootstrap: [${Name}CompositionComponent]
})
export class ${Name}CompositionModule {}
`,
  };
};

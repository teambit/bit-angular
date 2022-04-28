import { ComponentContext, ComponentFile } from '@teambit/generator';

export const compositionFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `${name}.composition.ts`,
    content: `import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ${Name}Module } from './${name}.module';

@Component({
  selector: '${name}-composition-cmp',
  template: \`${Name} composition: <${name}></${name}>\`
})
class ${Name}CompositionComponent {}

@NgModule({
  declarations: [${Name}CompositionComponent],
  imports: [BrowserModule, ${Name}Module],
  bootstrap: [${Name}CompositionComponent]
})
export class ${Name}CompositionModule {}
`,
  };
};

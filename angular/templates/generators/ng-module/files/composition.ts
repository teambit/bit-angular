import { ComponentContext, ComponentFile } from '@teambit/generator';

export const compositionFile = (context: ComponentContext, angularVersion: number): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  const moduleComposition = `import { Component, NgModule } from '@angular/core';
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
`;

  const standaloneComposition = `import { Component } from '@angular/core';
import { ${Name}Module } from './${name}.module';

@Component({
  standalone: true,
  selector: '${name}-composition-cmp',
  imports: [${Name}Module],
  template: \`${Name} composition: <${name}></${name}>\`
})
export class ${Name}CompositionComponent {}
`;

  return {
    relativePath: `${name}.composition.ts`,
    content: angularVersion >= 14 ? standaloneComposition : moduleComposition,
  };
};

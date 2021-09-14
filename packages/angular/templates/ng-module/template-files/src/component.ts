import { ComponentContext, ComponentFile } from '@teambit/generator';

export const componentFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `src/${name}.component.ts`,
    content: `import { Component } from '@angular/core';

@Component({
  selector: '${name}',
  template: \`
      <p>
      ${name} works!
      </p>
        \`,
  styleUrls: ['./${name}.component.scss']
})
export class ${Name}Component {
  constructor() {}
}
`,
  };
};

import { ComponentContext, ComponentFile } from '@teambit/generator';

export const componentFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `${name}.component.ts`,
    content: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: '${name}',
  standalone: true,
  imports: [CommonModule],
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

import { ComponentContext, ComponentFile } from '@teambit/generator';

export const appComponentFile = (context: ComponentContext): ComponentFile => {
  const { name } = context;
  return {
    relativePath: `src/app/app.component.ts`,
    content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '${name}';
}
`,
  };
};

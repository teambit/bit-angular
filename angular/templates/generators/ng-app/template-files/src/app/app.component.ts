import { ComponentContext, ComponentFile } from '@teambit/generator';

export const appComponentFile = (context: ComponentContext, styleSheet: string, standalone: boolean): ComponentFile => {
  const { name } = context;
  return {
    relativePath: `src/app/app.component.ts`,
    content: `import { Component } from '@angular/core';${standalone ? `
import { CommonModule } from '@angular/common';` : ''}
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',${standalone ? `
  standalone: true,
  imports: [CommonModule, RouterOutlet],` : ''}
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.${ styleSheet }']
})
export class AppComponent {
  title = '${name}';
}
`,
  };
};

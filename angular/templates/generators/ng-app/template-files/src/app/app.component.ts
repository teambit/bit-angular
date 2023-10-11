import { ComponentContext, ComponentFile } from '@teambit/generator';

export const appComponentFile = (context: ComponentContext, angularVersion: number): ComponentFile => {
  const { name } = context;
  return {
    relativePath: `src/app/app.component.ts`,
    content: angularVersion >= 17 ? `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '${name}';
}
` : `import { Component } from '@angular/core';

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

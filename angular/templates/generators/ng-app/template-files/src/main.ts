import { ComponentFile } from '@teambit/generator';

export const mainNgAppFile = (standalone: boolean): ComponentFile => {
  return {
    relativePath: `src/main.ts`,
    content: `import 'zone.js';
${standalone ? `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
` : `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`}`,
  };
};

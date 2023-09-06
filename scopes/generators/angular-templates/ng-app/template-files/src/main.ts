import { ComponentContext, ComponentFile } from '@teambit/generator';

export const mainNgAppFile = (context: ComponentContext): ComponentFile => {
  return {
    relativePath: `src/main.ts`,
    content: `import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`,
  };
};

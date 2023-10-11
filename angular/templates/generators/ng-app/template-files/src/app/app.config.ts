import { ComponentFile } from '@teambit/generator';

export const appConfigFile = (): ComponentFile => {
  return {
    relativePath: `src/app/app.config.ts`,
    content: `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
`,
  };
};

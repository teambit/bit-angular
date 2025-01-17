import { ComponentFile } from '@teambit/generator';

export const appConfigFile = (ssr: boolean): ComponentFile => {
  return {
    relativePath: `src/app/app.config.ts`,
    content: `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';${ssr ? `
import { provideClientHydration } from '@angular/platform-browser';` : ''}
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)${ssr ? ', provideClientHydration()' : ''}]
};
`,
  };
};

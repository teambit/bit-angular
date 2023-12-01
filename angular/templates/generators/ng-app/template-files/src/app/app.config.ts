import { ComponentFile } from '@teambit/generator';

export const appConfigFile = (angularVersion: number, ssr: boolean): ComponentFile => {
  return {
    relativePath: `src/app/app.config.ts`,
    content: `import { ApplicationConfig } from '${angularVersion >= 16 ? '@angular/core' : '@angular/platform-browser'}';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';${ssr ? `
import { provideClientHydration } from '@angular/platform-browser';` : ''}

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)${ssr ? ', provideClientHydration()' : ''}]
};
`,
  };
};

import { ComponentFile } from '@teambit/generator';

export const serverConfigFile = (): ComponentFile => {
  return {
    relativePath: `src/app/app.config.server.ts`,
    content: `import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering()
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
`,
  };
};

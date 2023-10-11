import { ComponentFile } from '@teambit/generator';

export const appRoutesFile = (): ComponentFile => {
  return {
    relativePath: `src/app/app.routes.ts`,
    content: `import { Routes } from '@angular/router';

export const routes: Routes = [];
`,
  };
};

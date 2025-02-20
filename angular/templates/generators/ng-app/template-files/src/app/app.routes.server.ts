import { ComponentFile } from '@teambit/generator';

export const appRoutesServerFile = (): ComponentFile => {
  return {
    relativePath: `src/app/app.routes.ts`,
    content: `import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];`,
  };
};

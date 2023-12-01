import { ComponentContext, ComponentFile } from '@teambit/generator';

export const indexHtmlFile = (context: ComponentContext): ComponentFile => {
  const { namePascalCase: Name } = context;
  return {
    relativePath: `src/index.html`,
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${Name}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="https://angular.dev/assets/icons/favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`
  };
};

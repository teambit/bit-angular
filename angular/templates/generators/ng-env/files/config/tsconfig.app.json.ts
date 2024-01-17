export const tsConfigAppFile = () => {
  return {
    relativePath: './config/tsconfig.app.json',
    content: `/* To learn more about this file see: https://angular.io/config/tsconfig. */
/* This config is used for bit start and bit build to generate the preview */
{
  "extends": "./tsconfig.json",
  /* Do not change files/include/exclude */
  "files": [
    "./src/main.ts",
    "./src/polyfills.ts"
  ],
  "include": [
    "./src/app/**/*.ts",
  ],
  "exclude": [
    "./src/app/**/*.spec.ts"
  ]
}
`,
  };
};
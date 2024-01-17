export const tsConfigSpecFile = () => {
  return {
    relativePath: './config/tsconfig.spec.json',
    content: `/* To learn more about this file see: https://angular.io/config/tsconfig. */
/* This config is used for bit test */
{
  "extends": "./tsconfig.json",
  "include": ["**/*.spec.+(js|ts)", "**/*.test.+(js|ts)", "**/*.d.ts"]
}
`,
  };
};

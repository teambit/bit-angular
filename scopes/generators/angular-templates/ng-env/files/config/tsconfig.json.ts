export const tsConfigFile = () => {
  return {
    relativePath: './config/tsconfig.json',
    content: `/**
 * @see https://bit.dev/reference/typescript/typescript-config
 */
{
  "extends": "@teambit/angular-base/config/tsconfig.json",
  "include": ["**/*", "**/*.json"]
}
`,
  };
};

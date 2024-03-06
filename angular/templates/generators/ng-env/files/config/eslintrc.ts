export const eslintConfigFile = () => {
  return {
    relativePath: './config/eslintrc.js',
    content: `/**
 * @see https://bit.dev/reference/eslint/eslint-config
 */
module.exports = {
  extends: [import.meta.resolve('@bitdev/angular.dev-services.linter.eslint')],
  rules: {},
};
`,
  };
};

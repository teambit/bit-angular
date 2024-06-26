export const eslintConfigFile = () => {
  return {
    relativePath: './config/eslintrc.cjs',
    content: `/**
 * @see https://bit.dev/reference/eslint/eslint-config
 */
module.exports = {
  extends: [require.resolve('@bitdev/angular.dev-services.linter.eslint')],
  rules: {},
};
`,
  };
};

export const prettierConfigFile = () => {
  return {
    relativePath: './config/prettier.config.cjs',
    content: `/**
 * @see https://bit.dev/reference/prettier/prettier-config
 */
const { prettierConfig } = require('@bitdev/angular.envs.base-env');

module.exports = {
  ...prettierConfig,
};
`,
  };
};

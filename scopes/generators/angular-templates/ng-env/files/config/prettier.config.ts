export const prettierConfigFile = () => {
  return {
    relativePath: './config/prettier.config.ts',
    content: `/**
 * @see https://bit.dev/reference/prettier/prettier-config
 */
const { prettierConfig } = require('@teambit/angular-base');

module.exports = {
  ...prettierConfig,
};
`,
  };
};

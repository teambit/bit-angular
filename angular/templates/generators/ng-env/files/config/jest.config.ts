export const jestConfigFile = (angularVersion: number, envPkgName: string) => {
  return {
    relativePath: './config/jest.config.cjs',
    content: `/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const jestConfig = require('${envPkgName}/jest/jest.config.cjs');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');
${angularVersion >= 16 ? `
const { defaultTransformerOptions } = require('jest-preset-angular/presets');
` : ''}

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];

module.exports = {
  ...jestConfig,
  ${angularVersion >= 16 ? `transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        ...defaultTransformerOptions,
        tsconfig: require.resolve('./tsconfig.spec.json')
      }
    ]
  },` : `globals: {
    ${angularVersion > 13 ? `ngJest: {
      skipNgcc: true
    },
    ` : ''}'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json')
    }
  },`}
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};`,
  };
};

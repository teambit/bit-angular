/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const jestConfig = require('@bitdev/angular.angular-env/jest/jest.config.cjs');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');
const { defaultTransformerOptions } = require('jest-preset-angular/presets');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];
module.exports = {
  ...jestConfig,
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        ...defaultTransformerOptions,
        tsconfig: require.resolve('./tsconfig.spec.json')
      }
    ]
  },
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};

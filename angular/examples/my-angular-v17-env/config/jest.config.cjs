/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const { jestConfig } = require('@bitdev/angular.envs.angular-v17-env');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');
const { defaultTransformerOptions } = require('jest-preset-angular/presets');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];

export default {
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

/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const { jestConfig } = require('@bitdev/angular.envs.angular-v15-env');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];

module.exports = {
  ...jestConfig,
  globals: {
    ngJest: {
      skipNgcc: true
    },
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json')
    }
  },
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};

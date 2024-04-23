/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const jestConfig = require('@bitdev/angular.envs.angular-v13-env/jest/jest.config.cjs');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];

module.exports = {
  ...jestConfig,
  globals: {
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json'),
    },
  },
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};

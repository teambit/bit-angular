/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const jestConfig = require('@bitdev/angular.angular-env/jest/jest.config.cjs');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');
const { createCjsPreset } = require('jest-preset-angular/presets');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];
const presetConfig = createCjsPreset({
  tsconfig: require.resolve('./tsconfig.spec.json')
});

module.exports = {
  ...jestConfig,
  ...presetConfig,
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};

/**
 * @see https://bit.dev/reference/jest/jest-config
 */
import { jestConfig } from '@bitdev/angular.angular-env';
import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';
const { defaultTransformerOptions } = require('jest-preset-angular/presets');

const packagesToExclude: string[] = ['@angular', '@ngrx', 'apollo-angular'];
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

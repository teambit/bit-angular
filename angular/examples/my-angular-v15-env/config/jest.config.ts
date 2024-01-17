/**
 * @see https://bit.dev/reference/jest/jest-config
 */
import { jestConfig } from '@bitdev/angular.envs.angular-v15-env';
import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';

const packagesToExclude: string[] = ['@angular', '@ngrx', 'apollo-angular'];

export default {
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

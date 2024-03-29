import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';

const { defaultTransformerOptions } = require('jest-preset-angular/presets');

const packagesToExclude: string[] = ['@angular', '@ngrx', 'apollo-angular'];

export default {
  preset: 'jest-preset-angular',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('jest-preset-angular/setup-jest')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    ngJest: {
      skipNgcc: true
    }
  },
  resolver: require.resolve('./jest.resolver.js'),
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
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

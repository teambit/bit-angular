import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';

const packagesToExclude: string[] = ['@angular', '@ngrx'];

export default {
  preset: 'jest-preset-angular',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('./setup-jest.js')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json'),
    },
  },
  moduleNameMapper: {
    // map angular modules to avoid duplicated modules
    "(@angular\/.*)$": ["<rootDir>/node_modules/$1", "$1"]
  },
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    'node_modules/(?!(jest-test))',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true,
    }),
  ],
};

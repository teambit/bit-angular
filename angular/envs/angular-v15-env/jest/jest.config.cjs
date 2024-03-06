const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];

module.exports = {
  preset: 'jest-preset-angular',
  globalSetup: 'jest-preset-angular/global-setup',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('./setup-jest.cjs')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    ngJest: {
      skipNgcc: true
    },
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json')
    }
  },
  resolver: require.resolve('./jest.resolver.cjs'),
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true,
    }),
  ],
};

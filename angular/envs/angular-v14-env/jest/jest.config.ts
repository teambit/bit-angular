import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';

const packagesToExclude: string[] = ['@angular', '@ngrx', 'apollo-angular'];

export default {
  preset: 'jest-preset-angular',
  globalSetup: 'jest-preset-angular/global-setup',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('./setup-jest')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    ngJest: {
      skipNgcc: true
    },
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json')
    }
  },
  resolver: require.resolve('./jest.resolver.js'),
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true,
    }),
  ],
};

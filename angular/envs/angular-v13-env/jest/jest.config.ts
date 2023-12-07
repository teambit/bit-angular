import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';

const packagesToExclude: string[] = ['@angular', '@ngrx', 'apollo-angular'];

export default {
  preset: 'jest-preset-angular',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('./setup-jest')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json'),
    },
  },
  moduleNameMapper: {
    // map angular modules to avoid duplicated modules
    /* eslint-disable-next-line no-useless-escape */
    "(@angular\/.*)$": ["<rootDir>/node_modules/$1", "$1"]
  },
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true,
    }),
  ],
};

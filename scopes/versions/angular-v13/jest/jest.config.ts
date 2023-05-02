import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';
const packagesToExclude: string[] = ['@angular', '@ngrx'];

export default {
  preset: 'jest-preset-angular',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('jest-preset-angular/setup-jest')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json'),
    },
  },
  moduleNameMapper: {
    // map angular modules to the root node_modules to avoid duplicated modules
    "(@angular\/animations.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/common.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/compiler.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/compiler-cli.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/core.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/forms.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/platform-browser.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/platform-browser-dynamic.*)$": "<rootDir>/node_modules/$1",
    "(@angular\/router.*)$": "<rootDir>/node_modules/$1",
  },
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true,
    }),
  ],
};

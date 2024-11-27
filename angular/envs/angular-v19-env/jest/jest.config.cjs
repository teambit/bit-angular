const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');
const { createCjsPreset } = require('jest-preset-angular/presets');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];
const presetConfig = createCjsPreset({
  tsconfig: require.resolve('./tsconfig.spec.json')
});

module.exports = {
  ...presetConfig,
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('./setup-jest.cjs')],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    ngJest: {
      skipNgcc: true
    }
  },
  resolver: require.resolve('./jest.resolver.cjs'),
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};

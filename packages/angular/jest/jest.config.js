module.exports = {
  preset: 'jest-preset-angular',
  reporters: ['default'],
  setupFilesAfterEnv: [require.resolve('./setup-jest.js')],
  transformIgnorePatterns: ['node_modules/(?!(jest-test))'],
  testPathIgnorePatterns: ['<rootDir>/.*/e2e/'],
  globals: {
    'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json'),
    },
  },
};

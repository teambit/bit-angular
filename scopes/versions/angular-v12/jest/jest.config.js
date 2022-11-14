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
  }
};
/*
  @angular/animations": "^12.2.16",
  "@angular/common": "^12.2.16",
  "@angular/compiler": "^12.2.16",
  "@angular/compiler-cli": "^12.2.16",
  "@angular/core": "^12.2.16",
  "@angular/forms": "^12.2.16",
  "@angular/platform-browser": "^12.2.16",
  "@angular/platform-browser-dynamic": "^12.2.16",
  "@angular/router": "^12.2.16",

 */

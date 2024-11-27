export const jestConfigFile = (angularVersion: number, envPkgName: string) => {
  return {
    relativePath: './config/jest.config.cjs',
    content: `/**
 * @see https://bit.dev/reference/jest/jest-config
 */
const jestConfig = require('${envPkgName}/jest/jest.config.cjs');
const { generateNodeModulesPattern } = require('@teambit/dependencies.modules.packages-excluder');
const { ${angularVersion >= 19 ? `createCjsPreset` : `defaultTransformerOptions`} } = require('jest-preset-angular/presets');

const packagesToExclude = ['@angular', '@ngrx', 'apollo-angular'];
${angularVersion >= 19 ? `const presetConfig = createCjsPreset({
  tsconfig: require.resolve('./tsconfig.spec.json')
});
` : ''}
module.exports = {
  ...jestConfig,
  ${angularVersion >= 19 ? `...presetConfig,`: `transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        ...defaultTransformerOptions,
        tsconfig: require.resolve('./tsconfig.spec.json')
      }
    ]
  },`}
  transformIgnorePatterns: [
    '^.+.module.(css|sass|scss)$',
    generateNodeModulesPattern({
      packages: packagesToExclude,
      excludeComponents: true
    })
  ]
};`,
  };
};

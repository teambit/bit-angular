export const jestConfigFile = (angularVersion: number, envPkgName: string) => {
  return {
    relativePath: './config/jest.config.ts',
    content: `/**
 * @see https://bit.dev/reference/jest/jest-config
 */
import { jestConfig } from '${envPkgName}';
import { generateNodeModulesPattern } from '@teambit/dependencies.modules.packages-excluder';
${angularVersion >= 16 ? `
const { defaultTransformerOptions } = require('jest-preset-angular/presets');
` : ''}
const packagesToExclude: string[] = ['@angular', '@ngrx', 'apollo-angular'];

export default {
  ...jestConfig,
  ${angularVersion >= 16 ? `transform: {
    '^.+\\\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        ...defaultTransformerOptions,
        tsconfig: require.resolve('./tsconfig.spec.json')
      }
    ]
  },` : `globals: {
    ${angularVersion > 13 ? `ngJest: {
      skipNgcc: true
    },
    ` : ''}'ts-jest': {
      tsconfig: require.resolve('./tsconfig.spec.json')
    }
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

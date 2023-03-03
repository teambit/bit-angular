export const jestConfigFile = (angularVersion: number) => {
  return {
    relativePath: './config/jest.config.ts',
    content: `/**
 * @see https://bit.dev/reference/jest/jest-config
 */
import { jestConfig } from '@teambit/angular-v${angularVersion}';

export default {
  ...jestConfig,
};`,
  };
};

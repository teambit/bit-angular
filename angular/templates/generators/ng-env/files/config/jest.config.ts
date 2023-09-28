export const jestConfigFile = (angularVersion: number, envPkgName: string) => {
  return {
    relativePath: './config/jest.config.ts',
    content: `/**
 * @see https://bit.dev/reference/jest/jest-config
 */
import { jestConfig } from '${envPkgName}';

export default {
  ...jestConfig,
};`,
  };
};

import { ComponentContext } from '@teambit/generator';
import { readFileSync } from 'fs-extra';

export const envJsoncFile = (context: ComponentContext, angularVersion: number) => {
  const jsoncFile = require.resolve(`@bitdev/angular.envs.angular-v${angularVersion}-env/env.jsonc`);
  return readFileSync(jsoncFile, 'utf-8');
};

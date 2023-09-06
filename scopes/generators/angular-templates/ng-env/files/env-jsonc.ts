import { ComponentContext } from '@teambit/generator';
import { readFileSync } from 'fs-extra';

export const envJsoncFile = (context: ComponentContext, angularVersion: number) => {
  const jsoncFile = require.resolve(`@teambit/angular-v${angularVersion}/env.jsonc`);
  return readFileSync(jsoncFile, 'utf-8');
};

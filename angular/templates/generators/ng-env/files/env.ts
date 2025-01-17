import { ComponentContext } from '@teambit/generator';

export function envFile({ namePascalCase: Name, name }: ComponentContext, envName: string, angularVersion: number, envPkgName: string) {
  // language=TypeScript
  return `import { ${envName} } from '${envPkgName}';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);

export class ${Name} extends ${envName} {
  /* Name of the environment, used for friendly mentions across bit */
  name = '${name}';

  /* Typescript config used for linter, schema extractor and config writer */
  protected tsconfigPath = req.resolve('./config/tsconfig.json');

  /* ESLint config. Learn how to replace linter - https://bit.dev/reference/linting/set-up-linter */
  protected eslintConfigPath = req.resolve('./config/eslintrc.cjs');

  /* Prettier config. Learn how to replace formatter - https://bit.dev/reference/formatting/set-up-formatter */
  protected prettierConfigPath = req.resolve('./config/prettier.config.cjs');

  /* Component mounting and dev-server config. Learn how to replace dev-server - https://bit.dev/reference/preview/setup-preview */
  protected previewMounterPath = req.resolve('./config/mounter.js');

  /* Jest config. Learn how to replace tester - https://bit.dev/reference/testing/set-up-tester */
  protected jestConfigPath = req.resolve('./config/jest.config.cjs');
}

export default new ${Name}();
`;
}

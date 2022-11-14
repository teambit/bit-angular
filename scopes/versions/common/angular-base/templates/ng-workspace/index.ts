import { WorkspaceContext, WorkspaceTemplate } from '@teambit/generator';
import { eslintConfig } from './files/eslint-config';
import { prettierConfig } from './files/prettier-config';
import { tsConfig } from './files/ts-config';
import { workspaceConfig } from './files/workspace-config';
import { readme } from './files/readme-file';
import { gitIgnore } from './files/git-ignore';

export const ngWorkspaceTemplate: WorkspaceTemplate = {
  name: 'ng-workspace',
  description: 'An Angular workspace template',
  generateFiles: async(context: WorkspaceContext) => [{
    relativePath: 'workspace.jsonc',
    content: await workspaceConfig(context)
  }, {
    relativePath: '.gitignore',
    content: gitIgnore()
  }, {
    relativePath: 'README.md',
    content: readme(context)
  }, {
    relativePath: `.eslintrc.js`,
    content: eslintConfig
  }, {
    relativePath: `tsconfig.json`,
    content: tsConfig
  }, {
    relativePath: `.prettierrc.js`,
    content: prettierConfig
  }]
};

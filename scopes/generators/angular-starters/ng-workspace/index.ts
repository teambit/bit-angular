import { WorkspaceContext, WorkspaceTemplate } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { eslintConfig } from './files/eslint-config';
import { launchJson } from './files/launch-json';
import { prettierConfig } from './files/prettier-config';
import { tsConfig } from './files/ts-config';
import { workspaceConfig } from './files/workspace-config';
import { gitIgnore } from './files/git-ignore';

export class NgWorkspaceTemplate implements WorkspaceTemplate {
  private constructor(
    readonly name = 'angular',
    readonly description = 'an Angular workspace template',
    readonly hidden = false
  ) {
  }

  async generateFiles(context: WorkspaceContext) {
    return [{
      relativePath: 'workspace.jsonc',
      content: await workspaceConfig(context)
    }, {
      relativePath: '.gitignore',
      content: gitIgnore()
    }, {
      relativePath: '.vscode/launch.json',
      content: launchJson(context)
    }, {
      relativePath: `.eslintrc.js`,
      content: eslintConfig
    }, {
      relativePath: `tsconfig.json`,
      content: tsConfig
    }, {
      relativePath: `.prettierrc.js`,
      content: prettierConfig
    }];
  }

  static from(options: AngularComponentTemplateOptions) {
    return () =>
      new NgWorkspaceTemplate(
        options.name,
        options.description,
        options.hidden
      );
  }
}

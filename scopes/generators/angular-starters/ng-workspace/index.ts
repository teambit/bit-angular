import { WorkspaceContext, WorkspaceTemplate } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { eslintConfig } from './files/eslint-config';
import { launchJson } from './files/launch-json';
import { prettierConfig } from './files/prettier-config';
import { tsConfig } from './files/ts-config';
import { workspaceConfig } from './files/workspace-config';
import { gitIgnore } from './files/git-ignore';
import { EnvContext, EnvHandler } from '@teambit/envs';
import PkgAspect, { PkgMain } from '@teambit/pkg';
import { FORKED_ENV_NAME } from '../constants';

export class NgWorkspaceTemplate implements WorkspaceTemplate {
  private constructor(
    readonly angularVersion: number,
    readonly name = 'angular',
    readonly description = 'an Angular workspace template',
    readonly hidden = false,
    private pkg: PkgMain
  ) {
  }

  async generateFiles(context: WorkspaceContext) {
    const envPkgName = this.pkg.getPackageName(context.aspectComponent!);
    return [{
      relativePath: 'workspace.jsonc',
      content: await workspaceConfig(context, envPkgName)
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

  fork() {
    return [{
      id: `teambit.angular/forks.angular-env-v${this.angularVersion}`,
      targetName: FORKED_ENV_NAME
    }];
  }

  static from(options: AngularComponentTemplateOptions & { angularVersion: number }): EnvHandler<WorkspaceTemplate> {
    return (context: EnvContext) => {
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      return new NgWorkspaceTemplate(
        options.angularVersion,
        options.name,
        options.description,
        options.hidden,
        pkg
      );
    };
  }
}

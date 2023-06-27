import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { WorkspaceContext, WorkspaceTemplate } from '@teambit/generator';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { eslintConfig } from '../common/eslint-config';
import { gitIgnore } from '../common/git-ignore';
import { launchJson } from '../common/launch-json';
import { prettierConfig } from '../common/prettier-config';
import { tsConfig } from '../common/ts-config';
import { workspaceConfig } from '../common/workspace-config';
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

  fork(context?: WorkspaceContext) {
    let forkName = `angular-env-v${this.angularVersion}`;

    if (context) {
      const envPkgName = this.pkg.getPackageName(context.aspectComponent!);
      forkName = envPkgName === '@teambit/angular' ? 'angular-env-default' : `angular-env-v${this.angularVersion}`;
    }

    return [{
      id: `teambit.angular/forks/${forkName}`,
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

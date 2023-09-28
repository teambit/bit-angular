import { AngularComponentTemplateOptions } from '@bitdev/angular.dev-services.common';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { WorkspaceContext, WorkspaceTemplate } from '@teambit/generator';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { gitIgnore } from '../common/git-ignore';
import { launchJson } from '../common/launch-json';
import { workspaceConfig } from '../common/workspace-config';
import { FORKED_ENV_NAME } from '../constants';

export class AngularStarter implements WorkspaceTemplate {
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
    }];
  }

  fork(context?: WorkspaceContext) {
    let forkName = `angular-v${this.angularVersion}-env`;

    if (context) {
      const envPkgName = this.pkg.getPackageName(context.aspectComponent!);
      forkName = envPkgName === '@bitdev/angular.angular-env' ? 'my-angular-env' : `my-angular-v${this.angularVersion}-env`;
    }

    return [{
      id: `bitdev.angular/examples/${forkName}`,
      targetName: FORKED_ENV_NAME
    }];
  }

  static from(options: AngularComponentTemplateOptions & { angularVersion: number }): EnvHandler<WorkspaceTemplate> {
    return (context: EnvContext) => {
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      return new AngularStarter(
        options.angularVersion,
        options.name,
        options.description,
        options.hidden,
        pkg
      );
    };
  }
}

import { WorkspaceContext, WorkspaceTemplate } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { eslintConfig } from '../common/eslint-config';
import { launchJson } from '../common/launch-json';
import { prettierConfig } from '../common/prettier-config';
import { tsConfig } from '../common/ts-config';
import { workspaceConfig } from '../common/workspace-config';
import { gitIgnore } from '../common/git-ignore';
import { EnvContext, EnvHandler } from '@teambit/envs';
import PkgAspect, { PkgMain } from '@teambit/pkg';
import { DEFAULT_SCOPE_NAME } from '../constants';

export class MaterialDesignSystemStarter implements WorkspaceTemplate {
  private constructor(
    readonly name = 'material-design-system',
    readonly description = 'an Angular workspace template to create a design system using Angular Material',
    readonly hidden = false,
    private pkg: PkgMain
  ) {
  }

  async generateFiles(context: WorkspaceContext) {
    const envPkgName = this.pkg.getPackageName(context.aspectComponent!);
    return [{
      relativePath: 'workspace.jsonc',
      content: await workspaceConfig(context, envPkgName, 'apps/my-angular-app')
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

  fork(context: WorkspaceContext) {
    const scope = context.defaultScope || DEFAULT_SCOPE_NAME;
    const env = `${scope}/envs/my-angular-env`;
    return [
      { id: `learnbit-angular.material-design-system/envs/my-angular-env` },
      { id: `learnbit-angular.material-design-system/apps/my-angular-app`, env },
      { id: `learnbit-angular.material-design-system/theme/my-base-theme` },
      { id: `learnbit-angular.material-design-system/theme/my-dark-theme` },
      { id: `learnbit-angular.material-design-system/theme/my-light-theme` },
      { id: `learnbit-angular.material-design-system/ui/my-dialog`, env },
      { id: `learnbit-angular.material-design-system/ui/my-theme-picker`, env },
    ];
  }

  static from(options: AngularComponentTemplateOptions): EnvHandler<WorkspaceTemplate> {
    return (context: EnvContext) => {
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      return new MaterialDesignSystemStarter(
        options.name,
        options.description,
        options.hidden,
        pkg
      );
    };
  }
}

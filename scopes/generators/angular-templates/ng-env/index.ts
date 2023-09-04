import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { EnvContext } from '@teambit/envs';
import { ComponentContext, ComponentTemplate, ConfigContext } from '@teambit/generator';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { eslintConfigFile } from './files/config/eslintrc';
import { jestConfigFile } from './files/config/jest.config';
import { prettierConfigFile } from './files/config/prettier.config';
import { tsConfigFile } from './files/config/tsconfig.json';
import { docFile } from './files/doc';
import { envFile } from './files/env';
import { envJsoncFile } from './files/env-jsonc';
import { indexFile } from './files/index';
import { hostDependenciesFile } from './files/preview/host-dependencies';
import { mounterFile } from './files/preview/mounter';
import { Component, ComponentID } from '@teambit/component';

export class NgEnvTemplate implements ComponentTemplate {
  private constructor(
    readonly envName: string,
    readonly angularVersion: number,
    readonly name = 'ng-env',
    readonly description = 'create a customized Angular env with your configs and tools',
    readonly hidden = false,
    private pkg: PkgMain,
    private workspace: Workspace,
  ) {}

  async generateFiles(context: ComponentContext) {
    const aspectId: ComponentID = typeof context.aspectId === 'string' ? ComponentID.fromString(context.aspectId) : context.aspectId;
    const envComponent = await this.workspace.get(aspectId);
    const envPkgName = this.pkg.getPackageName(envComponent);
    const envId = envComponent.id.toStringWithoutVersion();
    return [
      {
        relativePath: 'index.ts',
        content: indexFile(context),
        isMain: true,
      }, {
        relativePath: `env.jsonc`,
        content: envJsoncFile(context, this.angularVersion),
      }, {
        relativePath: `${context.name}.docs.mdx`,
        content: docFile(context, this.angularVersion, envId),
      }, {
        relativePath: `${context.name}.bit-env.ts`,
        content: envFile(context, this.envName, this.angularVersion, envPkgName),
      },
      eslintConfigFile(),
      jestConfigFile(this.angularVersion, envPkgName),
      prettierConfigFile(),
      tsConfigFile(),
      mounterFile(),
      hostDependenciesFile(),
    ];
  }

  config(context: ConfigContext) {
    return {
      'teambit.envs/envs': {
        env: 'teambit.envs/env',
      }
    };
  }

  static from(options: AngularComponentTemplateOptions & { envName: string; angularVersion: number; }) {
    return (context: EnvContext) => {
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      const workspace = context.getAspect<Workspace>(WorkspaceAspect.id);
      return new NgEnvTemplate(
        options.envName,
        options.angularVersion,
        options.name,
        options.description,
        options.hidden,
        pkg,
        workspace,
      );
    }
  }
}

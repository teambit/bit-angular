import { ComponentContext, ComponentTemplate, ConfigContext } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { eslintConfigFile } from './files/config/eslintrc';
import { jestConfigFile } from './files/config/jest.config';
import { prettierConfigFile } from './files/config/prettier.config';
import { tsConfigFile } from './files/config/tsconfig.json';
import { docFile } from './files/doc';
import { envFile } from './files/env';
import { indexFile } from './files/index';
import { envJsoncFile } from './files/env-jsonc';
import { mounterFile } from './files/preview/mounter';
import { hostDependenciesFile } from './files/preview/host-dependencies';

export class NgEnvTemplate implements ComponentTemplate {
  private constructor(
    readonly envName: string,
    readonly packageName: string,
    readonly angularVersion: number,
    readonly name = 'ng-env',
    readonly description = 'create a customized Angular env with your configs and tools',
    readonly hidden = false
  ) {}

  generateFiles(context: ComponentContext) {
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
        content: docFile(context),
      }, {
        relativePath: `${context.name}.bit-env.ts`,
        content: envFile(context, this.envName, this.packageName),
      },
      eslintConfigFile(),
      jestConfigFile(this.angularVersion),
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

  static from(options: AngularComponentTemplateOptions & { envName: string; packageName: string; angularVersion: number; }) {
    return () =>
      new NgEnvTemplate(
        options.envName,
        options.packageName,
        options.angularVersion,
        options.name,
        options.description,
        options.hidden
      );
  }
}

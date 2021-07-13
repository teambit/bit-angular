import { ComponentContext } from '@teambit/generator';

export function extensionFile({ namePascalCase: Name }: ComponentContext) {
  return `import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { AngularV12Aspect, AngularV12Main } from '@teambit/angular-v12'

export class ${Name}Extension {
  constructor(private angular: AngularV12Main) {}

  static dependencies: any = [EnvsAspect, AngularV12Aspect]

  static async provider([envs, angular]: [EnvsMain, AngularV12Main]) {
    const ${Name}Env = angular.compose([
      /**
       * Use any of the "angular.override..." transformers, for example:
       * angular.overrideCompilerOptions({
       *   fullTemplateTypeCheck: false
       * })
       */
    ])

    envs.registerEnv(${Name}Env)

    return new ${Name}Extension(angular)
  }
}
`;
}

import { ComponentContext } from '@teambit/generator';

export function extensionFile({ namePascalCase: Name }: ComponentContext) {
  return `import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { AngularAspect, AngularMain } from '@teambit/angular'

export class ${Name}Extension {
  constructor(private angular: AngularMain) {}

  static dependencies: any = [EnvsAspect, AngularAspect]

  static async provider([envs, angular]: [EnvsMain, AngularMain]) {
    // Use any of the "angular.override..." transformers, for example:
    const compilerOptions = await angular.overrideCompilerOptions({
      fullTemplateTypeCheck: false
    });
    const ${Name}Env = angular.compose([compilerOptions])
    envs.registerEnv(${Name}Env)

    return new ${Name}Extension(angular)
  }
}
`;
}

import { ComponentContext } from '@teambit/generator';

export function extensionFile({ namePascalCase: Name }: ComponentContext) {
  return `import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { AngularV13Aspect, AngularV13Main } from '@teambit/angular-v13'

export class ${Name}Extension {
  constructor(private angular: AngularV13Main) {}

  static dependencies: any = [EnvsAspect, AngularV13Aspect]

  static async provider([envs, angular]: [EnvsMain, AngularV13Main]) {
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

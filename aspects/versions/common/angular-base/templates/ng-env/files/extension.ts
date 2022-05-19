import { ComponentContext } from '@teambit/generator';

export function extensionFile({ namePascalCase: Name }: ComponentContext) {
  return `import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { AngularAspect, AngularMain } from '@teambit/angular'

export class ${Name}Extension {
  constructor(private angular: AngularMain) {}

  static dependencies: any = [EnvsAspect, AngularAspect]

  static async provider([envs, angular]: [EnvsMain, AngularMain]) {
    // Use any of the "angular.override..." or "angular.use..." transformers, for example:
    const compilerOptions = await angular.overrideCompilerOptions({
      fullTemplateTypeCheck: false
    });
    const useAngularElement = angular.useAngularElement();
    const ${Name}Env = angular.compose([compilerOptions, useAngularElement])
    envs.registerEnv(${Name}Env)

    return new ${Name}Extension(angular)
  }
}
`;
}

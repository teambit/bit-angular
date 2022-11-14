import { ComponentContext } from '@teambit/generator';

export function extensionFile({ namePascalCase: Name }: ComponentContext) {
  return `import { EnvsMain, EnvsAspect } from '@teambit/envs';
import { AngularAspect, AngularMain } from '@teambit/angular';

export class ${Name}Extension {
  static dependencies: any = [EnvsAspect, AngularAspect];

  static async provider([envs, angular]: [EnvsMain, AngularMain]) {
    // Use any of the "angular.override..." or "angular.use..." transformers, for example:
    // const compilerOptions = await angular.overrideCompilerOptions({ fullTemplateTypeCheck: false });
    // const overrideAngularEnvOptions = angular.overrideAngularEnvOptions({ useAngularElementsPreview: true });
    // const transformers = [compilerOptions, overrideAngularEnvOptions];
    const transformers = [];

    const ${Name}Env = angular.compose(transformers);
    envs.registerEnv(${Name}Env);

    return new ${Name}Extension();
  }
}
`;
}

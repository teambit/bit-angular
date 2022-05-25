import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { AngularV12Aspect, AngularV12Main } from '@teambit/angular-v12';

export class CustomEnvExtension {
  static dependencies: any = [EnvsAspect, AngularV12Aspect]

  static async provider([envs, angular]: [EnvsMain, AngularV12Main]) {
    const CustomEnvEnv = angular.compose([
      /**
       * Use any of the "angular.override..." transformers, for example:
       * angular.overrideCompilerOptions({
       *   fullTemplateTypeCheck: false
       * })
       */
      angular.overrideAngularEnvOptions({useAngularElementsPreview: true})
    ]);

    envs.registerEnv(CustomEnvEnv)

    return new CustomEnvExtension();
  }
}

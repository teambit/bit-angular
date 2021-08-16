import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { AngularV12Aspect, AngularV12Main } from '@teambit/angular-v12'

export class CustomEnvExtension {
  constructor(private angular: AngularV12Main) {}

  static dependencies: any = [EnvsAspect, AngularV12Aspect]

  static async provider([envs, angular]: [EnvsMain, AngularV12Main]) {
    const CustomEnvEnv = angular.compose([
      /**
       * Use any of the "angular.override..." transformers, for example:
       * angular.overrideCompilerOptions({
       *   fullTemplateTypeCheck: false
       * })
       */
      angular.overrideAngularOptions({styles: ['my-style.scss']})
    ])

    envs.registerEnv(CustomEnvEnv)

    return new CustomEnvExtension(angular)
  }
}

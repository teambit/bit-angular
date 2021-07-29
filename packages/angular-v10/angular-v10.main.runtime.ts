import { AngularDeps, AngularMain, AngularPreview } from '@teambit/angular';
import { AngularV10Aspect } from './angular-v10.aspect';
import { AngularV10Env } from './angular-v10.env';

export class AngularV10Main extends AngularMain {
  static async provider([
    jestAspect,
    compiler,
    eslint,
    ngPackagr,
    generator,
    webpack,
    workspace,
    compositions,
    envs,
  ]: AngularDeps): Promise<AngularMain> {
    const angularV10Env = new AngularV10Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      webpack,
      workspace,
      compositions
    );
    return new AngularV10Main(envs, angularV10Env);
  }
}

AngularV10Aspect.addRuntime(AngularPreview);
AngularV10Aspect.addRuntime(AngularV10Main);
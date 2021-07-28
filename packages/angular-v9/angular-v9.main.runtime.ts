import { AngularDeps, AngularMain, AngularPreview } from '@teambit/angular';
import { AngularV9Aspect } from './angular-v9.aspect';
import { AngularV9Env } from './angular-v9.env';

export class AngularV9Main extends AngularMain {
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
    const angularV9Env = new AngularV9Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      webpack,
      workspace,
      compositions
    );
    return new AngularV9Main(envs, angularV9Env);
  }
}

AngularV9Aspect.addRuntime(AngularPreview);
AngularV9Aspect.addRuntime(AngularV9Main);

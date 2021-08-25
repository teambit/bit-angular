import { AngularDeps, AngularMain, AngularPreview } from '@teambit/angular';
import { AngularV8Aspect } from './angular-v8.aspect';
import { AngularV8Env } from './angular-v8.env';

export class AngularV8Main extends AngularMain {
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
    isolator,
  ]: AngularDeps): Promise<AngularMain> {
    const angularV8Env = new AngularV8Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      isolator,
      webpack,
      workspace,
      compositions,
    );
    return new AngularV8Main(envs, angularV8Env);
  }
}

AngularV8Aspect.addRuntime(AngularPreview);
AngularV8Aspect.addRuntime(AngularV8Main);

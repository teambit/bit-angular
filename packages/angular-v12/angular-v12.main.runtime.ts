import { AngularDeps, AngularMain, AngularPreview } from '@teambit/angular';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Env } from './angular-v12.env';

export class AngularV12Main extends AngularMain {
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
    pkg,
  ]: AngularDeps): Promise<AngularMain> {
    const angularV12Env = new AngularV12Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      isolator,
      webpack,
      workspace,
      compositions,
      pkg,
    );
    return new AngularV12Main(envs, angularV12Env);
  }
}

AngularV12Aspect.addRuntime(AngularPreview);
AngularV12Aspect.addRuntime(AngularV12Main);

import { AngularDeps, AngularMain } from '@teambit/angular';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Env } from './angular-v12.env';

export class AngularV12Main extends AngularMain {
  static async provider([
    jestAspect,
    compiler,
    tester,
    eslint,
    ngPackagr,
    generator,
    webpack,
    workspace,
    envs,
    isolator,
    pkg,
  ]: AngularDeps): Promise<AngularMain> {
    const angularV12Env = new AngularV12Env(
      jestAspect,
      compiler,
      tester,
      eslint,
      ngPackagr,
      generator,
      isolator,
      webpack,
      workspace,
      pkg,
    );
    return new AngularV12Main(envs, angularV12Env);
  }
}

AngularV12Aspect.addRuntime(AngularV12Main);

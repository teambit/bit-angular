import { AngularDeps, AngularMain } from '@teambit/angular';
import { AngularV11Aspect } from './angular-v11.aspect';
import { AngularV11Env } from './angular-v11.env';

export class AngularV11Main extends AngularMain {
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
    const angularV11Env = new AngularV11Env(
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
    return new AngularV11Main(envs, angularV11Env);
  }
}

AngularV11Aspect.addRuntime(AngularV11Main);

import { AngularDeps, AngularMain } from '@teambit/angular';
import { AngularV10Aspect } from './angular-v10.aspect';
import { AngularV10Env } from './angular-v10.env';

export class AngularV10Main extends AngularMain {
  static async provider([
    jestAspect,
    compiler,
    tester,
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
    const angularV10Env = new AngularV10Env(
      jestAspect,
      compiler,
      tester,
      eslint,
      ngPackagr,
      generator,
      isolator,
      webpack,
      workspace,
      compositions,
      pkg,
    );
    return new AngularV10Main(envs, angularV10Env);
  }
}

AngularV10Aspect.addRuntime(AngularV10Main);

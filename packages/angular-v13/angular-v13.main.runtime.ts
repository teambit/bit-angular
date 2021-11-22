import { AngularDeps, AngularMain } from '@teambit/angular';
import { AngularV13Aspect } from './angular-v13.aspect';
import { AngularV13Env } from './angular-v13.env';

export class AngularV13Main extends AngularMain {
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
    const angularV13Env = new AngularV13Env(
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
    return new AngularV13Main(envs, angularV13Env);
  }
}

AngularV13Aspect.addRuntime(AngularV13Main);

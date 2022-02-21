import { AngularDeps, AngularMain } from '@teambit/angular';
import { AngularV9Aspect } from './angular-v9.aspect';
import { AngularV9Env } from './angular-v9.env';

export class AngularV9Main extends AngularMain {
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
    application,
    aspectLoader,
    multicompiler,
    babel,
    dependencyResolver,
  ]: AngularDeps): Promise<AngularMain> {
    const angularV9Env = new AngularV9Env(
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
      application,
      aspectLoader,
      multicompiler,
      babel,
      dependencyResolver,
    );
    return new AngularV9Main(envs, angularV9Env);
  }
}

AngularV9Aspect.addRuntime(AngularV9Main);

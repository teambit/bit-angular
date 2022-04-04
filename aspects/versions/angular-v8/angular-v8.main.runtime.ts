import { AngularDeps, AngularBaseMain } from '@teambit/angular-base';
import { AngularV8Aspect } from './angular-v8.aspect';
import { AngularV8Env } from './angular-v8.env';

export class AngularV8Main extends AngularBaseMain {
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
  ]: AngularDeps): Promise<AngularBaseMain> {
    const angularV8Env = new AngularV8Env(
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
    return new AngularV8Main(envs, angularV8Env);
  }
}

AngularV8Aspect.addRuntime(AngularV8Main);

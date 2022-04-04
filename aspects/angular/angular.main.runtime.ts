import { AngularV13Main } from '@teambit/angular-v13';
import { AngularDeps, AngularBaseMain } from '@teambit/angular-base';
import { AngularAspect } from './angular.aspect';
import { AngularEnv } from './angular.env';

export class AngularMain extends AngularV13Main {
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
    const angularEnv = new AngularEnv(
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
    // @ts-ignore
    return new AngularMain(envs, angularEnv);
  }
}

AngularAspect.addRuntime(AngularMain);

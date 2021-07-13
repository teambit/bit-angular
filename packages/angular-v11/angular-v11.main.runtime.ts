import { AngularDeps, AngularMain, AngularPreview } from '@teambit/angular';
import { AngularV11Aspect } from './angular-v11.aspect';
import { AngularV11Env } from './angular-v11.env';

export class AngularV11Main extends AngularMain {
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
  ]: AngularDeps) {
    const angularV11Env = new AngularV11Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      webpack,
      workspace,
      compositions
    );
    return new AngularV11Main(envs, angularV11Env);
  }
}

AngularV11Aspect.addRuntime(AngularPreview);
AngularV11Aspect.addRuntime(AngularV11Main);

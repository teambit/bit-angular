import { AngularV15Env } from '@teambit/angular-v15';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularEnv extends AngularV15Env {
  name = 'Angular';
  packageName = '@teambit/angular';
}

export default new AngularEnv();

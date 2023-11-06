import { AngularV17Env } from '@bitdev/angular.envs.angular-v17-env';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularEnv extends AngularV17Env {
  name = 'Angular';
}

export default new AngularEnv();

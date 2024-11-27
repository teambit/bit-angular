import { AngularV19Env } from '@bitdev/angular.envs.angular-v19-env';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularEnv extends AngularV19Env {
  name = 'Angular';
}

export default new AngularEnv();

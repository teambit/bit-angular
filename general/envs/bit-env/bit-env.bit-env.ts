import { BitAspectEnv } from "@bitdev/general.envs.bit-aspect-env";
import { StarterList, TemplateList } from "@teambit/generator";
import { NativeCompileCache } from "@teambit/toolbox.performance.v8-cache";

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class BitEnv extends BitAspectEnv {
  name = "env";

  /**
   * A list of starters for new projects.
   * This helps create a quick and standardized workspace setup.
   */
  override starters() {
    return StarterList.from([]);
  }

  /**
   * Sets a list of component templates to use across your workspaces.
   * New workspaces would be set to include your envs by default.
   */
  override generators() {
    return TemplateList.from([]);
  }
}

export default new BitEnv();

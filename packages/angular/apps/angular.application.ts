import { AppBuildContext, AppContext, Application } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Port } from '@teambit/toolbox.network.get-port';
import { join } from 'path';
import { AngularDeployContext } from './deploy-context';
import { AngularEnv } from '../angular.env';
import { AngularAppBuildResult } from './angular-build-result';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';

export class AngularApp implements Application {
  constructor(
    private angularEnv: AngularEnv,
    readonly name: string,
    readonly portRange: number[],
    readonly bundler?: Bundler,
    readonly transformers?: WebpackConfigTransformer[],
    readonly deploy?: (context: AngularDeployContext) => Promise<void>
  ) {}

  readonly publicDir = 'public';

  private getDevServerContext(context: AppContext): DevServerContext {
    return Object.assign(context, {
      entry: [],
      rootPath: '',
      publicPath: `public/${this.name}`,
      title: this.name
    });
  }

  async getDevServer(context: AppContext): Promise<DevServer> {
    const devServerContext = this.getDevServerContext(context);
    return this.angularEnv.getDevServer(devServerContext, this.transformers);
  }

  async run(context: AppContext): Promise<number> {
    const [from, to] = this.portRange;
    const port = await Port.getPort(from, to);
    const devServer = await this.getDevServer(context);
    await devServer.listen(port);
    return port;
  }

  async getBundler(context: AppBuildContext): Promise<Bundler> {
    if (this.bundler) {
      return this.bundler;
    }

    const { capsule } = context;
    const outputPath = pathNormalizeToLinux(join(capsule.path, this.publicDir));

    const bundlerContext: BundlerContext = Object.assign(context, {
      targets: [{
        components: [capsule?.component],
        entries: [],
        outputPath
      }],
      entry: [],
      rootPath: '/',
      appName: this.name
    });
    return this.angularEnv.getBundler(bundlerContext, this.transformers);
  }

  async build(context: AppBuildContext): Promise<AngularAppBuildResult> {
    const bundler = await this.getBundler(context);
    await bundler.run();
    return { publicDir: this.publicDir };
  }
}

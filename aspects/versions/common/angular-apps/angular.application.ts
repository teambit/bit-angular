import { AppBuildContext, AppContext, Application } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { Port } from '@teambit/toolbox.network.get-port';
import { AngularAppOptions } from './angular-app-options';
import { AngularAppBuildResult } from './angular-build-result';
import { cloneDeep } from 'lodash';
import { GenericAngularEnv } from './generic-angular-env';

export class AngularApp implements Application {
  readonly name: string;

  constructor(
    private angularEnv: GenericAngularEnv,
    readonly options: AngularAppOptions
  ) {
    this.name = options.name;
  }

  readonly publicDir = 'public';

  private getDevServerContext(context: AppContext): DevServerContext {
    return Object.assign(cloneDeep(context), {
      entry: [],
      rootPath: '',
      publicPath: `${this.publicDir}/${this.options.name}`,
      title: this.options.name
    });
  }

  async getDevServer(context: AppContext): Promise<DevServer> {
    const devServerContext = this.getDevServerContext(context);
    const angularServeOptions = { ...this.angularEnv.angularWebpack.angularServeOptions, ...this.options.angularServeOptions };
    return this.angularEnv.getDevServer(devServerContext, this.options.webpackTransformers, angularServeOptions, this.options.sourceRoot);
  }

  async run(context: AppContext): Promise<number> {
    const [from, to] = this.options.portRange || [3000, 4000];
    const port = await Port.getPort(from, to);
    const devServer = await this.getDevServer(context);
    await devServer.listen(port);
    return port;
  }

  async getBundler(context: AppBuildContext): Promise<Bundler> {
    if (this.options.bundler) {
      return this.options.bundler;
    }

    const { capsule } = context;
    const outputPath = pathNormalizeToLinux(capsule.path);

    const bundlerContext: BundlerContext = Object.assign(cloneDeep(context), {
      targets: [{
        components: [capsule?.component],
        entries: [],
        outputPath
      }],
      entry: [],
      rootPath: '/',
      appName: this.options.name
    });
    const angularBuildOptions = { ...this.angularEnv.angularWebpack.angularBuildOptions, ...this.options.angularBuildOptions };
    return this.angularEnv.getBundler(bundlerContext, this.options.webpackTransformers, angularBuildOptions, this.options.sourceRoot);
  }

  async build(context: AppBuildContext): Promise<AngularAppBuildResult> {
    const bundler = await this.getBundler(context);
    await bundler.run();
    return { publicDir: this.publicDir };
  }
}

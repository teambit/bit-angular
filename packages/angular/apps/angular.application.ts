import { AppBuildContext, AppContext, Application } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { Port } from '@teambit/toolbox.network.get-port';
import { join } from 'path';
import { AngularEnv } from '../angular.env';
import { AngularAppOptions } from './angular-app-options';
import { AngularAppBuildResult } from './angular-build-result';

export class AngularApp implements Application {
  readonly name: string;

  constructor(
    private angularEnv: AngularEnv,
    readonly options: AngularAppOptions
  ) {
    this.name = options.name;
  }

  readonly publicDir = 'public';

  private getDevServerContext(context: AppContext): DevServerContext {
    return Object.assign(context, {
      entry: [],
      rootPath: '',
      publicPath: `public/${this.options.name}`,
      title: this.options.name
    });
  }

  async getDevServer(context: AppContext): Promise<DevServer> {
    const devServerContext = this.getDevServerContext(context);
    return this.angularEnv.getDevServer(devServerContext, this.options.webpackTransformers);
  }

  async run(context: AppContext): Promise<number> {
    const [from, to] = this.options.portRange || [3000, 4000];
    const port = await Port.getPort(from, to);
    this.angularEnv.angularWebpack.angularServeOptions = { ...this.angularEnv.angularWebpack.angularServeOptions, ...this.options.angularServeOptions };
    this.angularEnv.angularWebpack.sourceRoot = this.options.sourceRoot;
    const devServer = await this.getDevServer(context);
    await devServer.listen(port);
    return port;
  }

  async getBundler(context: AppBuildContext): Promise<Bundler> {
    if (this.options.bundler) {
      return this.options.bundler;
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
      appName: this.options.name
    });
    this.angularEnv.angularWebpack.angularBuildOptions = { ...this.angularEnv.angularWebpack.angularBuildOptions, ...this.options.angularBuildOptions };
    this.angularEnv.angularWebpack.sourceRoot = this.options.sourceRoot;
    return this.angularEnv.getBundler(bundlerContext, this.options.webpackTransformers);
  }

  async build(context: AppBuildContext): Promise<AngularAppBuildResult> {
    const bundler = await this.getBundler(context);
    await bundler.run();
    return { publicDir: this.publicDir };
  }
}

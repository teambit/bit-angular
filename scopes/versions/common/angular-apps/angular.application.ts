import { GenericAngularEnv } from '@teambit/angular-common';
import { AppBuildContext, AppContext, Application } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { Port } from '@teambit/toolbox.network.get-port';
import { cloneDeep } from 'lodash';
import { AngularPreview, BundlerProvider, DevServerProvider } from '@teambit/angular-preview';
import { AngularAppOptions } from './angular-app-options';
import { AngularAppBuildResult } from './angular-build-result';
import { Preview } from '@teambit/preview';
import { join } from 'path';

export class AngularApp implements Application {
  readonly name: string;
  readonly preview: EnvHandler<Preview>;

  constructor(
    private angularEnv: GenericAngularEnv,
    private envContext: EnvContext,
    readonly options: AngularAppOptions
  ) {
    this.name = options.name;
    this.preview = this.getPreview();
  }

  readonly publicDir = 'public';

  private getPublicDir(artifactsDir: string) {
    return join(artifactsDir, this.name);
  }

  private getDevServerContext(context: AppContext): DevServerContext {
    return Object.assign(cloneDeep(context), {
      entry: [],
      rootPath: '',
      publicPath: `${this.publicDir}/${this.options.name}`,
      title: this.options.name
    });
  }

  private getPreview(): EnvHandler<Preview> {
    const ngEnvOptions = this.angularEnv.getNgEnvOptions();
    const devServerProvider: DevServerProvider = (devServerContext: DevServerContext) => this.angularEnv.getDevServer(devServerContext, ngEnvOptions, this.options.webpackServeTransformers, this.options.angularServeOptions, {}, this.options.sourceRoot);
    const bundlerProvider: BundlerProvider = (bundlerContext: BundlerContext) => this.angularEnv.getBundler(bundlerContext, ngEnvOptions, this.options.webpackBuildTransformers, this.options.angularBuildOptions, {}, this.options.sourceRoot);
    return AngularPreview.from({
      devServerProvider,
      bundlerProvider,
      ngEnvOptions
    });
  }

  async getDevServer(context: AppContext): Promise<DevServer> {
    const devServerContext = this.getDevServerContext(context);
    const preview = this.preview(this.envContext);

    return preview.getDevServer(devServerContext)(this.envContext);
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

    const { capsule, artifactsDir } = context;
    const publicDir = this.getPublicDir(artifactsDir);
    const outputPath = pathNormalizeToLinux(join(capsule.path, publicDir));
    const preview = this.preview(this.envContext) as AngularPreview;

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
    return preview.getBundler(bundlerContext)(this.envContext);
  }

  async build(context: AppBuildContext): Promise<AngularAppBuildResult> {
    const bundler = await this.getBundler(context);
    await bundler.run();
    return {
      publicDir: `${this.getPublicDir(context.artifactsDir)}/${this.publicDir}`
    };
  }
}

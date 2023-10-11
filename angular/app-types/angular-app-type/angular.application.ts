import { GenericAngularEnv } from '@bitdev/angular.dev-services.common';
import { AngularPreview, BundlerProvider, DevServerProvider } from '@bitdev/angular.dev-services.preview.preview';
import { AppBuildContext, AppContext, Application } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Component } from '@teambit/component';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { Preview } from '@teambit/preview';
import { Port } from '@teambit/toolbox.network.get-port';
import { Workspace } from '@teambit/workspace';
import { existsSync, mkdirSync, writeFileSync } from 'fs-extra';
import { cloneDeep } from 'lodash';
import objectHash from 'object-hash';
import { join } from 'path';
import { readConfigFile, sys } from 'typescript';
import { AngularAppOptions } from './angular-app-options';
import { AngularAppBuildResult } from './angular-build-result';
import { expandIncludeExclude } from './utils';

const writeHash = new Map<string, string>();

export class AngularApp implements Application {
  readonly name: string;

  readonly preview: EnvHandler<Preview>;

  readonly tempFolder: string;

  readonly tsconfigPath: string;

  constructor(
    private angularEnv: GenericAngularEnv,
    private envContext: EnvContext,
    readonly options: AngularAppOptions,
    private depsResolver: DependencyResolverMain,
    private workspace?: Workspace
  ) {
    this.name = options.name;

    const idName = `bitdev.angular/${this.name}`;
    this.tempFolder = workspace?.getTempDir(idName) || join(CACHE_ROOT, idName);
    if (!existsSync(this.tempFolder)) {
      mkdirSync(this.tempFolder, { recursive: true });
    }

    this.tsconfigPath = pathNormalizeToLinux(join(this.tempFolder, `__tsconfig-${Date.now()}.json`));
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

    const serveOptions: any = Object.assign(cloneDeep(this.options.angularServeOptions), { tsConfig: this.tsconfigPath });
    const devServerProvider: DevServerProvider = (devServerContext: DevServerContext) => this.angularEnv.getDevServer(devServerContext, ngEnvOptions, this.options.webpackServeTransformers, serveOptions, {}, this.options.sourceRoot);

    const buildOptions: any = Object.assign(cloneDeep(this.options.angularBuildOptions), { tsConfig: this.tsconfigPath });
    const bundlerProvider: BundlerProvider = (bundlerContext: BundlerContext) => this.angularEnv.getBundler(bundlerContext, ngEnvOptions, this.options.webpackBuildTransformers, buildOptions, {}, this.options.sourceRoot);

    return AngularPreview.from({
      devServerProvider,
      bundlerProvider,
      ngEnvOptions
    });
  }

  private generateTsConfig(bitCmps: Component[], appRootPath: string, tsconfigPath: string): string {
    const tsconfigJSON = readConfigFile(tsconfigPath, sys.readFile).config;

    // Add the paths to tsconfig to remap bit components to local folders
    tsconfigJSON.compilerOptions.paths = tsconfigJSON.compilerOptions.paths || {};
    bitCmps.forEach((dep: Component) => {
        let componentDir = this.workspace?.componentDir(dep.id, {
          ignoreVersion: true
        });
        if (componentDir) {
          componentDir = pathNormalizeToLinux(componentDir);
          const pkgName = this.depsResolver.getPackageName(dep);
          // TODO we should find a way to use the real entry file based on the component config because people can change it
          tsconfigJSON.compilerOptions.paths[pkgName] = [`${componentDir}/public-api.ts`, `${componentDir}`];
          tsconfigJSON.compilerOptions.paths[`${pkgName}/*`] = [`${componentDir}/*`];
        }
    });

    const tsconfigContent = expandIncludeExclude(tsconfigJSON, this.tsconfigPath, [appRootPath]);
    const hash = objectHash(tsconfigContent);

    // write only if link has changed (prevents triggering fs watches)
    if (writeHash.get(this.tsconfigPath) !== hash) {
      writeFileSync(this.tsconfigPath, tsconfigContent);
      writeHash.set(this.tsconfigPath, hash);
    }

    return tsconfigContent;
  }

  async getDevServer(context: AppContext): Promise<DevServer> {
    if(!this.workspace) {
      throw new Error('workspace is not defined');
    }
    const appRootPath = this.workspace.componentDir(context.appComponent.id, {
      ignoreVersion: true
    }) || '';
    const tsconfigPath = join(appRootPath, this.options.angularServeOptions.tsConfig);
    const workspaceCmpsIDs = await this.workspace.listIds();
    const bitCmps = await this.workspace.getMany(workspaceCmpsIDs);
    this.generateTsConfig(bitCmps, appRootPath, tsconfigPath);
    const devServerContext = this.getDevServerContext(context);
    const preview = this.preview(this.envContext);

    return preview.getDevServer(devServerContext)(this.envContext);
  }

  async run(context: AppContext): Promise<number> {
    const port = context.port || (await Port.getPortFromRange(this.options.portRange || [3000, 4000]));
    const devServer = await this.getDevServer(context);
    await devServer.listen(port);
    return port;
  }

  async getBundler(context: AppBuildContext): Promise<Bundler> {
    if (typeof this.options.bundler !== 'string') {
      return this.options.bundler as Bundler;
    }

    if (this.options.bundler === 'vite') {
      throw new Error('implement vite bundler');
    }

    const { capsule, artifactsDir } = context;
    const publicDir = this.getPublicDir(artifactsDir);
    const outputPath = pathNormalizeToLinux(join(capsule.path, publicDir));
    const appRootPath = context.capsule.path;
    const tsconfigPath = join(appRootPath, this.options.angularBuildOptions.tsConfig);
    this.generateTsConfig([capsule?.component], appRootPath, tsconfigPath);
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

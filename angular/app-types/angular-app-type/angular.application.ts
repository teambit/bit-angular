import { VERSION } from '@angular/cli';
import {
  ApplicationOptions,
  GenericAngularEnv,
  normalizePath
} from '@bitdev/angular.dev-services.common';
import {
  AngularPreview,
  BundlerProvider,
  DevServerProvider
} from '@bitdev/angular.dev-services.preview.preview';
import { AppBuildContext, AppContext, Application } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Component } from '@teambit/component';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import { Logger } from '@teambit/logger';
import { Preview } from '@teambit/preview';
import { Port } from '@teambit/toolbox.network.get-port';
import { Workspace } from '@teambit/workspace';
import assert from 'assert';
import { existsSync, mkdirSync, outputJsonSync } from 'fs-extra';
import { cloneDeep } from 'lodash';
import objectHash from 'object-hash';
import { join } from 'path';
import { readConfigFile, sys } from 'typescript';
import { AngularAppOptions } from './angular-app-options';
import { AngularAppBuildResult } from './angular-build-result';
import { buildApplication } from './application.bundler';
import { serveApplication } from './application.dev-server';
import { expandIncludeExclude, JsonObject } from './utils';

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
    private logger: Logger,
    private workspace?: Workspace
  ) {
    this.name = options.name;

    const idName = `bitdev.angular/${ this.name }`;
    this.tempFolder = workspace?.getTempDir(idName) || join(CACHE_ROOT, idName);
    if (!existsSync(this.tempFolder)) {
      mkdirSync(this.tempFolder, { recursive: true });
    }

    this.tsconfigPath = normalizePath(join(this.tempFolder, `tsconfig/tsconfig-${ Date.now() }.json`));
    this.preview = this.getPreview();
  }

  readonly publicDir = 'public';

  private getPublicDir(artifactsDir: string) {
    return join(artifactsDir, this.name);
  }

  private getDevServerContext(context: AppContext, appRootPath: string): DevServerContext {
    // const ngEnvOptions = this.angularEnv.getNgEnvOptions();
    return Object.assign(cloneDeep(context), {
      entry: [],
      rootPath: /*ngEnvOptions.devServer === 'vite' ? appRootPath : */'',
      publicPath: `${ this.publicDir }/${ this.options.name }`,
      title: this.options.name
    });
  }

  private getBundlerContext(context: AppBuildContext): BundlerContext {
    const { capsule, artifactsDir } = context;
    const publicDir = this.getPublicDir(artifactsDir);
    const outputPath = normalizePath(join(capsule.path, publicDir));

    return Object.assign(cloneDeep(context), {
      targets: [{
        components: [capsule.component],
        entries: [],
        outputPath
      }],
      entry: [],
      rootPath: '.',
      appName: this.options.name
    });
  }

  private getPreview(): EnvHandler<Preview> {
    const ngEnvOptions = this.angularEnv.getNgEnvOptions();

    const angularServeOptions: any = Object.assign(cloneDeep(this.options.angularServeOptions), { tsConfig: this.tsconfigPath });
    const angularBuildOptions: any = Object.assign(cloneDeep(this.options.angularBuildOptions), { tsConfig: this.tsconfigPath });

    return AngularPreview.from({
      webpackServeTransformers: this.options.webpackServeTransformers,
      webpackBuildTransformers: this.options.webpackBuildTransformers,
      angularServeOptions,
      angularBuildOptions,
      ngEnvOptions,
      sourceRoot: this.options.sourceRoot,
    });

  }

  private generateTsConfig(bitCmps: Component[], appRootPath: string, tsconfigPath: string, serverEntry?: string): void {
    const tsconfigJSON: JsonObject = readConfigFile(tsconfigPath, sys.readFile).config;

    // Add the paths to tsconfig to remap bit components to local folders
    tsconfigJSON.compilerOptions.paths = tsconfigJSON.compilerOptions.paths || {};
    bitCmps.forEach((dep: Component) => {
      let componentDir = this.workspace?.componentDir(dep.id, {
        ignoreVersion: true
      });
      if (componentDir) {
        componentDir = normalizePath(componentDir);
        const pkgName = this.depsResolver.getPackageName(dep);
        // TODO we should find a way to use the real entry file based on the component config because people can change it
        if (existsSync(join(componentDir, 'public-api.ts'))) {
          tsconfigJSON.compilerOptions.paths[pkgName] = [`${ componentDir }/public-api.ts`, `${ componentDir }`];
        }
        tsconfigJSON.compilerOptions.paths[`${ pkgName }/*`] = [`${ componentDir }/*`];
      }
    });

    if (serverEntry) {
      tsconfigJSON.files.push(serverEntry);
    }

    const tsconfigContent = expandIncludeExclude(tsconfigJSON, this.tsconfigPath, [appRootPath]);
    const hash = objectHash(tsconfigContent);
    // write only if link has changed (prevents triggering fs watches)
    if (writeHash.get(this.tsconfigPath) !== hash) {
      outputJsonSync(this.tsconfigPath, tsconfigContent, { spaces: 2 });
      writeHash.set(this.tsconfigPath, hash);
    }
  }

  async getDevServer(context: AppContext, appRootPath: string): Promise<DevServer> {
    const devServerContext = this.getDevServerContext(context, appRootPath);
    const preview = this.preview(this.envContext);

    return preview.getDevServer(devServerContext)(this.envContext);
  }

  // TODO: fix return type once bit has a new stable version
  async run(context: AppContext): Promise<any> {
    assert(this.workspace, 'Workspace is not defined');
    const port = context.port || (await Port.getPortFromRange(this.options.portRange || [3000, 4000]));
    const appRootPath = this.workspace.componentDir(context.appComponent.id, {
      ignoreVersion: true
    });
    const tsconfigPath = join(appRootPath, this.options.angularServeOptions.tsConfig);
    const workspaceCmpsIDs = await this.workspace.listIds();
    const bitCmps = await this.workspace.getMany(workspaceCmpsIDs);
    this.generateTsConfig(bitCmps, appRootPath, tsconfigPath);

    if (Number(VERSION.major) >= 16) {
      await serveApplication({
        angularOptions: {
          ...this.options.angularBuildOptions as ApplicationOptions,
          tsConfig: this.tsconfigPath
        },
        sourceRoot: this.options.sourceRoot || 'src',
        workspaceRoot: appRootPath,
        port,
        logger: this.logger,
        tempFolder: this.tempFolder
      });
      return port;
    }

    const devServer = await this.getDevServer(context, appRootPath);
    await devServer.listen(port);
    return port;
  }

  async getBundler(context: AppBuildContext): Promise<Bundler> {
    if (this.options.bundler) {
      return this.options.bundler;
    }

    const bundlerContext = this.getBundlerContext(context);
    const preview = this.preview(this.envContext);

    return preview.getBundler(bundlerContext)(this.envContext);
  }

  async build(context: AppBuildContext): Promise<AngularAppBuildResult> {
    const { capsule } = context;
    const outputPath = this.getPublicDir(context.artifactsDir);
    const appRootPath = capsule.path;
    const tsconfigPath = join(appRootPath, this.options.angularBuildOptions.tsConfig);
    const appOptions = this.options.angularBuildOptions as ApplicationOptions;
    const entryServer = appOptions.ssr && Number(VERSION.major) >= 17 ? './entry.server.ts' : undefined;
    this.generateTsConfig([capsule.component], appRootPath, tsconfigPath, entryServer);

    if (!this.options.bundler && Number(VERSION.major) >= 16) {
      await buildApplication({
        angularOptions: {
          ...appOptions,
          tsConfig: this.tsconfigPath
        },
        outputPath,
        sourceRoot: this.options.sourceRoot || 'src',
        workspaceRoot: context.capsule.path,
        logger: this.logger,
        tempFolder: this.tempFolder,
        entryServer
      });
    } else {
      const bundler = await this.getBundler(context);
      await bundler.run();
    }
    return {
      publicDir: outputPath
    };
  }
}

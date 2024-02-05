import { VERSION } from '@angular/cli';
import {
  ApplicationOptions,
  getWorkspace,
  NG_APP_NAME,
  normalizePath
} from '@bitdev/angular.dev-services.common';
import { AngularPreview } from '@bitdev/angular.dev-services.preview.preview';
import {
  AppBuildContext,
  AppBuildResult,
  AppContext,
  Application,
  ApplicationInstance,
  DeployFn
} from '@teambit/application';
import { Bundler, BundlerContext, DevServerContext } from '@teambit/bundler';
import { Component } from '@teambit/component';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
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
import { buildApplication } from './application.bundler';
import { serveApplication } from './application.dev-server';
import { expandIncludeExclude, JsonObject } from './utils';

const writeHash = new Map<string, string>();

export class AngularApp implements Application {
  readonly name: string;
  readonly idName: string;
  readonly deploy?: DeployFn;

  constructor(
    readonly options: AngularAppOptions
  ) {
    this.name = options.name || NG_APP_NAME;
    this.idName = `bitdev.angular/${ this.name }`;
    this.deploy = options.deploy;
  }

  readonly publicDir = 'public';

  private getTempFolder(workspace?: Workspace): string {
    const tempFolder = workspace?.getTempDir(this.idName) || join(CACHE_ROOT, this.idName);
    if (!existsSync(tempFolder)) {
      mkdirSync(tempFolder, { recursive: true });
    }
    return tempFolder;
  }

  private getTsconfigPath(tempFolder: string): string {
    return normalizePath(join(tempFolder, `tsconfig/tsconfig-${ Date.now() }.json`));
  }

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

  private getPreview(tsconfigPath: string): EnvHandler<Preview> {
    const angularServeOptions: any = Object.assign(cloneDeep(this.options.angularServeOptions), { tsConfig: tsconfigPath });
    const angularBuildOptions: any = Object.assign(cloneDeep(this.options.angularBuildOptions), { tsConfig: tsconfigPath });

    return AngularPreview.from({
      webpackServeTransformers: this.options.webpackServeTransformers,
      webpackBuildTransformers: this.options.webpackBuildTransformers,
      angularServeOptions,
      angularBuildOptions,
      ngEnvOptions: this.options.ngEnvOptions,
      sourceRoot: this.options.sourceRoot
    });

  }

  private generateTsConfig(bitCmps: Component[], appRootPath: string, appTsconfigPath: string, tsconfigPath: string, depsResolver: DependencyResolverMain, workspace?: Workspace, serverEntry?: string): void {
    const tsconfigJSON: JsonObject = readConfigFile(appTsconfigPath, sys.readFile).config;

    // Add the paths to tsconfig to remap bit components to local folders
    tsconfigJSON.compilerOptions.paths = tsconfigJSON.compilerOptions.paths || {};
    bitCmps.forEach((dep: Component) => {
      let componentDir = workspace?.componentDir(dep.id, {
        ignoreVersion: true
      });
      if (componentDir) {
        componentDir = normalizePath(componentDir);
        const pkgName = depsResolver.getPackageName(dep);
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

    const tsconfigContent = expandIncludeExclude(tsconfigJSON, tsconfigPath, [appRootPath]);
    const hash = objectHash(tsconfigContent);
    // write only if link has changed (prevents triggering fs watches)
    if (writeHash.get(tsconfigPath) !== hash) {
      outputJsonSync(tsconfigPath, tsconfigContent, { spaces: 2 });
      writeHash.set(tsconfigPath, hash);
    }
  }

  /**
   * Transform the app context into env context to make typescript happy.
   * Technically, we only use methods that exist in both interfaces, so it's fine.
   */
  private getEnvContext(context: AppContext | AppBuildContext): EnvContext {
    return context as any as EnvContext;
  }

  private async getEnvFile(mode: string, rootDir: string, overrides?: Record<string, string>) {
    // TODO: enable this one we have ESM envs, otherwise we get a warning message about loading the deprecated CJS build of Vite
    // const vite = await loadEsmModule('vite');
    // const dotenv = vite.loadEnv(mode, rootDir);
    return {
      ...overrides
      // ...dotenv
    };
  }

  // TODO: fix return type once bit has a new stable version
  async run(context: AppContext): Promise<ApplicationInstance> {
    const depsResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
    assert(depsResolver, 'Dependency resolver is not defined');
    const workspace = getWorkspace(context);
    assert(workspace, 'Workspace is not defined');
    const logger = context.createLogger(this.name);
    const port = context.port || (await Port.getPortFromRange(this.options.portRange || [3000, 4000]));
    const appRootPath = workspace.componentDir(context.appComponent.id, {
      ignoreVersion: true
    });
    const appTsconfigPath = join(appRootPath, this.options.angularServeOptions.tsConfig);
    const workspaceCmpsIDs = await workspace.listIds();
    const bitCmps = await workspace.getMany(workspaceCmpsIDs);
    const tempFolder = this.getTempFolder(workspace);
    const tsconfigPath = this.getTsconfigPath(tempFolder);
    this.generateTsConfig(bitCmps, appRootPath, appTsconfigPath, tsconfigPath, depsResolver, workspace);

    if (Number(VERSION.major) >= 16) {
      const envVars = await this.getEnvFile('development', appRootPath, context.envVariables as any);
      await serveApplication({
        angularOptions: {
          ...this.options.angularBuildOptions as ApplicationOptions,
          tsConfig: tsconfigPath
        },
        sourceRoot: this.options.sourceRoot || 'src',
        workspaceRoot: appRootPath,
        port,
        logger: logger,
        tempFolder: tempFolder,
        envVars: {
          process: { env: envVars }
        }
      });
    } else {
      const devServerContext = this.getDevServerContext(context, appRootPath);
      const envContext = this.getEnvContext(context);
      const preview = this.getPreview(tsconfigPath)(envContext);

      const devServer = await preview.getDevServer(devServerContext)(envContext);
      await devServer.listen(port);
    }

    return {
      appName: this.name,
      port
    };
  }

  async build(context: AppBuildContext): Promise<AppBuildResult> {
    const { capsule } = context;
    const depsResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
    assert(depsResolver, 'Dependency resolver is not defined');
    const logger = context.createLogger(this.name);
    const outputPath = this.getPublicDir(context.artifactsDir);
    const appRootPath = capsule.path;
    const appTsconfigPath = join(appRootPath, this.options.angularBuildOptions.tsConfig);
    const appOptions = this.options.angularBuildOptions as ApplicationOptions;
    const entryServer = appOptions.ssr && Number(VERSION.major) >= 17 ? './entry.server.ts' : undefined;
    const tempFolder = this.getTempFolder();
    const tsconfigPath = this.getTsconfigPath(tempFolder);
    this.generateTsConfig([capsule.component], appRootPath, appTsconfigPath, tsconfigPath, depsResolver, undefined, entryServer);

    if (!this.options.bundler && Number(VERSION.major) >= 16) {
      const envVars = await this.getEnvFile('production', appRootPath, context.envVariables as any);
      await buildApplication({
        angularOptions: {
          ...appOptions,
          tsConfig: tsconfigPath
        },
        outputPath,
        sourceRoot: this.options.sourceRoot || 'src',
        workspaceRoot: context.capsule.path,
        logger: logger,
        tempFolder: tempFolder,
        entryServer,
        envVars: {
          'process.env': envVars
        }
      });
    } else {
      let bundler: Bundler;
      if (this.options.bundler) {
        bundler = this.options.bundler;
      } else {
        const bundlerContext = this.getBundlerContext(context);
        const envContext = this.getEnvContext(context);
        const preview = this.getPreview(tsconfigPath)(envContext);

        bundler = await preview.getBundler(bundlerContext)(envContext);
      }
      await bundler.run();
    }
    return {
      artifacts: [{
        name: this.name,
        globPatterns: [outputPath],
      }],
      metadata: {
        outputPath,
        nitroDir: join(outputPath, 'nitro'),
        publicDir: join(outputPath, 'browser'),
        ssrPublicDir: appOptions.ssr ? join(outputPath, 'server') : undefined
      }
    };
  }

  static from(options: AngularAppOptions): Application {
    return new AngularApp(options);
  }
}

import { Bundler, BundlerContext, DevServer, DevServerContext, Target } from '@teambit/bundler';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import { Component, ComponentID } from '@teambit/component';
import { PkgMain } from '@teambit/pkg';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { Logger } from '@teambit/logger';
import { Aspect } from '@teambit/harmony';
import { PubsubMain } from '@teambit/pubsub';
import {
  runTransformersWithContext,
  WebpackBundler,
  WebpackConfigMutator,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer,
  WebpackDevServer,
  WebpackMain,
} from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import type { BrowserBuilderOptions, DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { existsSync, mkdirSync, writeFileSync } from 'fs-extra';
import objectHash from 'object-hash';
import { join, posix, resolve } from 'path';
import { readConfigFile, sys } from 'typescript';
import { Configuration, WebpackPluginInstance } from 'webpack';
import { AppBuildContext, AppContext, ApplicationMain } from '@teambit/application';
import { componentIsApp } from './utils';
import { StatsLoggerPlugin } from './webpack-plugins/stats-logger';

export enum WebpackSetup {
  Serve = 'serve',
  Build = 'build',
}

export type BrowserOptions = Omit<BrowserBuilderOptions, "outputPath" | "preserveSymlinks">;
export type DevServerOptions = Omit<DevServerBuilderOptions, "aot" | "baseHref" | "browserTarget" | "commonChunk" | "deployUrl" | "hmrWarning" | "open" | "optimization" | "port" | "progress" | "servePathDefaultWarning" | "sourceMap" | "vendorChunk">;

export abstract class AngularWebpack {
  private timestamp = Date.now();
  private writeHash = new Map<string, string>();
  private readonly tempFolder: string;
  webpackServeOptions: Partial<WebpackConfigWithDevServer> = {}
  webpackBuildOptions: Partial<Configuration> = {}
  angularServeOptions: Partial<BrowserOptions & DevServerOptions> = {};
  angularBuildOptions: Partial<BrowserOptions> = {};
  sourceRoot = 'src';

  constructor(
    private workspace: Workspace | undefined,
    private webpackMain: WebpackMain,
    private pkg: PkgMain,
    private application: ApplicationMain,
    angularAspect: Aspect,
  ) {
    if (workspace) {
      this.tempFolder = workspace.getTempDir(angularAspect.id);
    } else {
      this.tempFolder = join(CACHE_ROOT, angularAspect.id);
    }
  }

  /** Abstract functions & properties specific to the adapter **/
  abstract enableIvy: boolean;
  abstract getWebpackConfig(
    context: DevServerContext | BundlerContext,
    entryFiles: string[],
    tsConfigPath: string,
    rootPath: string,
    logger: Logger,
    setup: WebpackSetup,
    webpackOptions: Partial<WebpackConfigWithDevServer>,
    angularOptions: any,
    sourceRoot?: string,
  ): Promise<WebpackConfigWithDevServer | Configuration>;
  abstract webpack: any;
  abstract webpackDevServer: any;
  abstract webpackServeConfigFactory: (
    devServerID: string,
    workspaceDir: string,
    entryFiles: string[],
    publicRoot: string,
    publicPath: string,
    pubsub: PubsubMain,
    nodeModulesPaths: string[],
    tempFolder: string,
    plugins?: WebpackPluginInstance[],
    IsApp?: boolean
  ) => WebpackConfigWithDevServer;
  abstract webpackBuildConfigFactory: (entryFiles: string[], outputPath: string, nodeModulesPaths: string[], workspaceDir: string, tempFolder: string, plugins?: WebpackPluginInstance[]) => Configuration;

  /**
   * Add the list of files to include into the typescript compilation as absolute paths
   */
  private generateTsConfig(appPath: string, includePaths: string[], excludePaths: string[] = [], tsPaths: {[key: string]: string[]}): string {
    const tsconfigPath = join(appPath, 'tsconfig.app.json');
    const tsconfigJSON = readConfigFile(tsconfigPath, sys.readFile);
    const pAppPath = pathNormalizeToLinux(appPath);

    tsconfigJSON.config.angularCompilerOptions.enableIvy = this.enableIvy;
    tsconfigJSON.config.files = [posix.join(pAppPath, 'src/main.ts'), posix.join(pAppPath, 'src/polyfills.ts')];
    tsconfigJSON.config.include = [
      posix.join(pAppPath, 'src/app/**/*.ts'),
      ...includePaths.map((path) => posix.join(path, '**/*.ts')),
    ];
    tsconfigJSON.config.exclude = [
      posix.join(pAppPath, '**/*.spec.ts'),
      ...excludePaths,
      ...includePaths.map((path) => posix.join(path, '**/*.spec.ts')),
    ];
    tsconfigJSON.config.compilerOptions.paths = tsPaths;

    return JSON.stringify(tsconfigJSON.config, undefined, 2);
  }

  isBuildContext(context: DevServerContext | BundlerContext): context is BundlerContext {
    return (context as BundlerContext).capsuleNetwork !== undefined;
  }

  isAppContext(context: DevServerContext | AppContext): context is DevServerContext & AppContext {
    return (context as AppContext).appComponent !== undefined;
  }

  isAppBuildContext(context: BundlerContext | AppBuildContext): context is BundlerContext & AppBuildContext {
    return (context as AppBuildContext).appComponent !== undefined;
  }

  /**
   * write a link to load custom modules dynamically.
   */
  writeTsconfig(context: DevServerContext | BundlerContext, rootSpace: string): string {
    const tsPaths: {[key: string]: string[]} = {};
    const includePaths = new Set<string>();
    const dirPath = join(this.tempFolder, context.id);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    // get the list of files for existing component compositions to include into the compilation
    context.components.forEach((component: Component) => {
      let outputPath: string;

      const isApp = componentIsApp(component, this.application);
      if(isApp) {
        return;
      }
      if (this.isBuildContext(context)) {
        const capsules = context.capsuleNetwork.graphCapsules;
        const capsule = capsules.getCapsule(component.id);
        if (!capsule) {
          throw new Error(`No capsule found for ${component.id} in network graph`);
        }
        outputPath = pathNormalizeToLinux(capsule.path);
      } else {
        outputPath = pathNormalizeToLinux(this.workspace?.componentDir(component.id, {ignoreScopeAndVersion: true, ignoreVersion: true}) || '');
      }
      // map the package names to the workspace component paths for typescript in case a package references another local package
      tsPaths[`${this.pkg.getPackageName(component)}`] = [`${outputPath}/public-api.ts`];
      tsPaths[`${this.pkg.getPackageName(component)}/*`] = [`${outputPath}/*`];

      includePaths.add(outputPath);
    });

    const content = this.generateTsConfig(rootSpace, Array.from(includePaths), [], tsPaths);
    const hash = objectHash(content);
    const targetPath = join(dirPath, `__tsconfig-${this.timestamp}.json`);

    // write only if link has changed (prevents triggering fs watches)
    if (this.writeHash.get(targetPath) !== hash) {
      writeFileSync(targetPath, content);
      this.writeHash.set(targetPath, hash);
    }

    return targetPath;
  }

  private getPreviewRootPath(): string {
    try {
      const rootPath = this.workspace?.componentDir(ComponentID.fromString('teambit.angular/angular'), {
        ignoreScopeAndVersion: true,
        ignoreVersion: true
      }, { relative: false }) || '';
      return join(rootPath, 'preview');
    } catch(e) {
      return resolve(require.resolve('@teambit/angular'), '../../preview/');
    }
  }

  async createDevServer(context: DevServerContext | (DevServerContext & AppContext), transformers: WebpackConfigTransformer[] = [], nodeModulesPaths: string[]): Promise<DevServer> {
    let appRootPath, tsconfigPath;
    const plugins: WebpackPluginInstance[] = [];
    let isApp = false;
    if(this.isAppContext(context)) { // When you use `bit run <app>`
      appRootPath = this.workspace?.componentDir(context.appComponent.id, {ignoreScopeAndVersion: true, ignoreVersion: true}) || '';
      tsconfigPath = join(appRootPath, 'tsconfig.app.json');
      isApp = true;
    } else { // When you use `bit start`
      appRootPath = this.getPreviewRootPath();
      tsconfigPath = this.writeTsconfig(context, appRootPath);
    }

    const defaultConfig: any = await this.getWebpackConfig(
      context,
      context.entry,
      tsconfigPath,
      appRootPath,
      this.webpackMain.logger,
      WebpackSetup.Serve,
      this.webpackServeOptions,
      this.angularServeOptions,
      this.sourceRoot
    );
    const defaultTransformer: WebpackConfigTransformer = (configMutator: WebpackConfigMutator) =>
      configMutator.merge([defaultConfig]);

    const config = this.webpackServeConfigFactory(
      context.id,
      this.workspace?.path || '',
      context.entry,
      context.rootPath,
      context.publicPath,
      this.webpackMain.pubsub,
      nodeModulesPaths,
      this.tempFolder,
      plugins,
      isApp
    );
    const configMutator = new WebpackConfigMutator(config);

    const afterMutation = runTransformersWithContext(
      configMutator.clone(),
      [defaultTransformer, ...transformers],
      { mode: 'dev' }
    );

    return new WebpackDevServer(afterMutation.raw as WebpackConfigWithDevServer, this.webpack as any, this.webpackDevServer as any);
  }

  private createPreviewConfig(context: BundlerContext | (BundlerContext & AppBuildContext), nodeModulesPaths: string[]): Configuration[] {
    let plugins: WebpackPluginInstance[] = [];
    if(this.isAppBuildContext(context)) {
      plugins = [new StatsLoggerPlugin()];
    }
    return context.targets.map((target) => {
      return this.webpackBuildConfigFactory(target.entries as string[], target.outputPath, nodeModulesPaths, this.workspace?.path || '', this.tempFolder, plugins);
    });
  }

  async createBundler(context: BundlerContext | (BundlerContext & AppBuildContext), transformers: any[], nodeModulesPaths: string[]): Promise<Bundler> {
    let appRootPath, tsconfigPath;
    if(this.isAppBuildContext(context)) {
      appRootPath = context.capsule.path;// this.workspace?.componentDir(context.appComponent.id, {ignoreScopeAndVersion: true, ignoreVersion: true}) || '';
      tsconfigPath = join(appRootPath, 'tsconfig.app.json');
    } else {
      appRootPath = this.getPreviewRootPath();
      tsconfigPath = this.writeTsconfig(context, appRootPath);
    }

    const defaultConfig: any = await this.getWebpackConfig(
      context,
      context.targets.map((target: Target) => target.entries).flat() as string[],
      tsconfigPath,
      appRootPath,
      this.webpackMain.logger,
      WebpackSetup.Build,
      this.webpackBuildOptions as WebpackConfigWithDevServer,
      this.angularBuildOptions,
      this.sourceRoot
    );
    const defaultTransformer: WebpackConfigTransformer = (configMutator: WebpackConfigMutator) =>
      configMutator.merge([defaultConfig]);

    const configs = this.createPreviewConfig(context, nodeModulesPaths);
    const mutatedConfigs = configs.map((config: any) => {
      const configMutator = new WebpackConfigMutator(config);
      const afterMutation = runTransformersWithContext(
        configMutator.clone(),
        [defaultTransformer, ...transformers],
        { mode: 'prod' }
      );
      return afterMutation.raw;
    });

    return new WebpackBundler(context.targets, mutatedConfigs, this.webpackMain.logger, this.webpack);
  }
}

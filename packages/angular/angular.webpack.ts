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
import { existsSync, mkdirSync, writeFileSync } from 'fs-extra';
import objectHash from 'object-hash';
import { join, posix, resolve } from 'path';
import { readConfigFile, sys } from 'typescript';
import { Configuration } from 'webpack';

export enum WebpackSetup {
  Serve = 'serve',
  Build = 'build',
}

export abstract class AngularWebpack {
  private timestamp = Date.now();
  private writeHash = new Map<string, string>();
  private readonly tempFolder: string;
  webpackServeOptions: Partial<WebpackConfigWithDevServer> = {}
  webpackBuildOptions: Partial<Configuration> = {}
  angularServeOptions: any = {};
  angularBuildOptions: any = {};

  constructor(
    private workspace: Workspace | undefined,
    private webpackMain: WebpackMain,
    private pkg: PkgMain,
    angularAspect: Aspect,
    private nodeModulesPaths: string[] = []
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
    angularOptions: any
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
    tsconfigPath: string,
    tempFolder: string,
  ) => WebpackConfigWithDevServer;
  abstract webpackBuildConfigFactory: (entryFiles: string[], rootPath: string, nodeModulesPaths: string[], workspaceDir: string, tempFolder: string) => Configuration;

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

      if (this.isBuildContext(context)) {
        const capsules = context.capsuleNetwork.graphCapsules;
        const capsule = capsules.getCapsule(component.id);
        if (!capsule) {
          throw new Error(`No capsule found for ${component.id} in network graph`);
        }
        outputPath = pathNormalizeToLinux(capsule.path);
      } else {
        outputPath = pathNormalizeToLinux(this.workspace?.componentDir(component.id, {ignoreScopeAndVersion: true, ignoreVersion: true}) || '');
        // map the package names to the local component paths for typescript since we don't use node_modules for local components in dev mode
        tsPaths[`${this.pkg.getPackageName(component)}`] = [`${outputPath}/public-api.ts`];
        tsPaths[`${this.pkg.getPackageName(component)}/*`] = [`${outputPath}/*`];
      }

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

  async createDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    const previewRootPath = this.getPreviewRootPath();
    const tsconfigPath = this.writeTsconfig(context, previewRootPath);

    const defaultConfig: any = await this.getWebpackConfig(
      context,
      context.entry,
      tsconfigPath,
      previewRootPath,
      this.webpackMain.logger,
      WebpackSetup.Serve,
      this.webpackServeOptions,
      this.angularServeOptions
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
      this.nodeModulesPaths,
      this.tempFolder,
      tsconfigPath,
    );
    const configMutator = new WebpackConfigMutator(config);

    const afterMutation = runTransformersWithContext(
      configMutator.clone(),
      [defaultTransformer, ...transformers],
      { mode: 'dev' }
    );

    return new WebpackDevServer(afterMutation.raw as WebpackConfigWithDevServer, this.webpack as any, this.webpackDevServer as any);
  }

  private createPreviewConfig(targets: Target[]): Configuration[] {
    return targets.map((target) => {
      return this.webpackBuildConfigFactory(target.entries, target.outputPath, this.nodeModulesPaths, this.workspace?.path || '', this.tempFolder);
    });
  }

  async createBundler(context: BundlerContext, transformers: any[]): Promise<Bundler> {
    // TODO(ocombe) find a better way to get the preview root path
    const previewRootPath = this.getPreviewRootPath();
    const tsconfigPath = this.writeTsconfig(context, previewRootPath);

    const defaultConfig: any = await this.getWebpackConfig(
      context,
      context.targets.map((target: Target) => target.entries).flat(),
      tsconfigPath,
      previewRootPath,
      this.webpackMain.logger,
      WebpackSetup.Build,
      this.webpackBuildOptions as WebpackConfigWithDevServer,
      this.angularBuildOptions
    );
    const defaultTransformer: WebpackConfigTransformer = (configMutator: WebpackConfigMutator) =>
      configMutator.merge([defaultConfig]);

    const configs = this.createPreviewConfig(context.targets);
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

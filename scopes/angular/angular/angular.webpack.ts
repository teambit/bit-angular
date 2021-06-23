import { Bundler, BundlerContext, DevServer, DevServerContext, Target } from '@teambit/bundler';
import { ComponentID } from '@teambit/component';
import { CompositionsMain } from '@teambit/compositions';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import {
  runTransformersWithContext,
  WebpackBundler,
  WebpackConfigMutator,
  WebpackConfigTransformContext,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer,
  WebpackDevServer,
  WebpackMain
} from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { existsSync, mkdirSync, writeFileSync } from 'fs-extra';
import objectHash from 'object-hash';
import { join, posix, resolve } from 'path';
import { readConfigFile, sys } from 'typescript';
import { Configuration } from 'webpack';
import { AngularVersionAdapter, WebpackSetup } from './angular-version-adapter';
import { AngularAspect } from './angular.aspect';

const DEFAULT_TEMP_DIR = join(CACHE_ROOT, AngularAspect.id);

export class AngularWebpack {
  private timestamp = Date.now();
  private writeHash = new Map<string, string>();
  private readonly tempFolder: string;

  constructor(private workspace: Workspace, private webpackMain: WebpackMain, private adapter: AngularVersionAdapter, private compositions: CompositionsMain) {
    this.tempFolder = workspace?.getTempDir(AngularAspect.id) || DEFAULT_TEMP_DIR;
  }

  /**
   * Add the list of files to include into the typescript compilation as absolute paths
   */
  private generateTsConfig(appPath: string, includePaths: string[]): string {
    const tsconfigPath = join(appPath, 'tsconfig.app.json');
    const tsconfigJSON = readConfigFile(tsconfigPath, sys.readFile);
    const pAppPath = pathNormalizeToLinux(appPath);

    tsconfigJSON.config.files = [
      posix.join(pAppPath, 'src/main.ts'),
      posix.join(pAppPath, 'src/polyfills.ts')
    ];
    tsconfigJSON.config.include = [
      posix.join(pAppPath, 'src/app/**/*.ts'),
      ...includePaths
    ];
    tsconfigJSON.config.exclude = [
      posix.join(pAppPath, '**/*.spec.ts')
    ];

    return JSON.stringify(tsconfigJSON.config, undefined, 2);
  }

  isBuildContext(context: DevServerContext | BundlerContext): context is BundlerContext {
    return (context as BundlerContext).capsuleNetwork !== undefined;
  }

  /**
   * write a link to load custom modules dynamically.
   */
  writeTsconfig(context: DevServerContext | BundlerContext, rootSpace: string): string {
    const compositionsFilesPaths = new Set<string>();
    const dirPath = join(this.tempFolder, context.id);
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

    // get the list of files for existing component compositions to include into the compilation
    context.components.forEach(component => {
      let componentFiles: string[];

      if (this.isBuildContext(context)) {
        const capsules = context.capsuleNetwork.graphCapsules;
        const capsule = capsules.getCapsule(component.id);
        if (!capsule) {
          throw new Error(`No capsule found for ${component.id} in network graph`);
        }
        componentFiles = capsule.getAllFilesPaths().map((filePath: string) => join(capsule.path, filePath));
      } else {
        componentFiles = component.filesystem.files.map(file => file.path);
      }

      this.compositions.readCompositions(component).forEach(composition => {
        if (composition.filepath) {
          const filePath = componentFiles.find(filePath => filePath.indexOf(composition.filepath!) !== -1);
          if (filePath) {
            compositionsFilesPaths.add(pathNormalizeToLinux(filePath));
          }
        }
      });
    });

    const content = this.generateTsConfig(rootSpace, Array.from(compositionsFilesPaths));
    const hash = objectHash(content);
    const targetPath = join(dirPath, `__tsconfig-${this.timestamp}.json`);

    // write only if link has changed (prevents triggering fs watches)
    if (this.writeHash.get(targetPath) !== hash) {
      writeFileSync(targetPath, content);
      this.writeHash.set(targetPath, hash);
    }

    return targetPath;
  }


  async createDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    // TODO(ocombe) find a better way to get the preview root path
    const rootPath = resolve(require.resolve('@teambit/angular'), '../../preview/');
    const tsconfigPath = this.writeTsconfig(context, rootPath);

    const defaultConfig: any = await this.adapter.getWebpackConfig(context, context.entry, tsconfigPath, rootPath, this.webpackMain.logger, WebpackSetup.Serve, {});
    const defaultTransformer: WebpackConfigTransformer = (configMutator: WebpackConfigMutator) => configMutator.merge([defaultConfig]);

    const config = this.adapter.webpackServeConfigFactory(context.id, this.workspace.path, context.entry, context.rootPath, context.publicPath, this.webpackMain.pubsub);
    const configMutator = new WebpackConfigMutator(config);

    const transformerContext: WebpackConfigTransformContext = { mode: 'dev' };
    const afterMutation = runTransformersWithContext(
      configMutator.clone(),
      [defaultTransformer, ...transformers],
      transformerContext
    );

    return new WebpackDevServer(afterMutation.raw as WebpackConfigWithDevServer, this.adapter.webpack, this.adapter.webpackDevServer);
  }

  private createPreviewConfig(targets: Target[]): Configuration[] {
    return targets.map((target) => {
      return this.adapter.webpackBuildConfigFactory(target.entries, target.outputPath);
    });
  }

  async createBundler(context: BundlerContext, transformers: any[]): Promise<Bundler> {
    const capsules = context.capsuleNetwork.graphCapsules;
    const angularCapsule = capsules.getCapsule(ComponentID.fromString(AngularAspect.id))
    const rootPath = join(angularCapsule!.path, 'preview');
    const tsconfigPath = this.writeTsconfig(context, rootPath);

    const defaultConfig: any = await this.adapter.getWebpackConfig(context, context.targets.map(target => target.entries).flat(), tsconfigPath, rootPath, this.webpackMain.logger, WebpackSetup.Build, {});
    const defaultTransformer: WebpackConfigTransformer = (configMutator: WebpackConfigMutator) => configMutator.merge([defaultConfig]);

    const configs = this.createPreviewConfig(context.targets);
    const transformerContext: WebpackConfigTransformContext = { mode: 'prod' };
    const mutatedConfigs = configs.map((config: any) => {
      const configMutator = new WebpackConfigMutator(config);
      const afterMutation = runTransformersWithContext(
        configMutator.clone(),
        [defaultTransformer, ...transformers],
        transformerContext
      );
      return afterMutation.raw;
    });

    return new WebpackBundler(context.targets, mutatedConfigs, this.webpackMain.logger);
  }
}

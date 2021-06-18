import { DevServer, DevServerContext } from '@teambit/bundler';
import { CompositionsMain } from '@teambit/compositions';
import { CACHE_ROOT } from '@teambit/legacy/dist/constants';
import {
  runTransformersWithContext,
  WebpackConfigMutator,
  WebpackConfigTransformContext,
  WebpackConfigTransformer,
  WebpackConfigWithDevServer,
  WebpackDevServer,
  WebpackMain
} from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { existsSync, mkdirSync, writeFileSync } from 'fs-extra';
import objectHash from 'object-hash';
import { join, posix, resolve } from 'path';
import { readConfigFile, sys } from 'typescript';
import { AngularVersionAdapter } from './angular-version-adapter';
import { AngularAspect } from './angular.aspect';

const DEFAULT_TEMP_DIR = join(CACHE_ROOT, AngularAspect.id);

export class AngularDevServer {
  private timestamp = Date.now();
  private writeHash = new Map<string, string>();
  private readonly tempFolder: string;

  constructor(private workspace: Workspace, private webpackMain: WebpackMain, private adapter: AngularVersionAdapter, private compositions: CompositionsMain) {
    this.tempFolder = workspace?.getTempDir(AngularAspect.id) || DEFAULT_TEMP_DIR
  }

  /**
   * Add the list of files to include into the typescript compilation as absolute paths
   */
  private generateTsConfig(appPath: string, includePaths: string[]): string {
    const tsconfigPath = join(appPath, 'tsconfig.app.json');
    const tsconfigJSON = readConfigFile(tsconfigPath, sys.readFile);
    const pAppPath = appPath.replace(/\\/g, '/');

    tsconfigJSON.config.files = [
      posix.join(pAppPath, 'src/main.ts'),
      posix.join(pAppPath, 'src/polyfills.ts'),
    ]
    tsconfigJSON.config.include = [
      posix.join(pAppPath, 'src/app/**/*.ts'),
      ...includePaths
    ]
    tsconfigJSON.config.exclude = [
      posix.join(pAppPath, '**/*.spec.ts')
    ]

    return JSON.stringify(tsconfigJSON.config, undefined, 2);
  }

  /**
   * write a link to load custom modules dynamically.
   */
  writeTsconfig(context: DevServerContext) {
    const compositionsFilesPaths = new Set<string>();
    const appPath = resolve(require.resolve('@teambit/angular'), '../../preview/');
    const dirPath = join(this.tempFolder, context.id);
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

    // get the list of files for existing component compositions to include into the compilation
    context.components.forEach(component => {
      const componentFiles = component.filesystem.files.map(file => file.path);
      this.compositions.readCompositions(component).forEach(composition => {
        if(composition.filepath) {
          const filePath = componentFiles.find(filePath => filePath.indexOf(composition.filepath!) !== -1);
          if(filePath) {
            compositionsFilesPaths.add(filePath.replace(/\\/g, '/'));
          }
        }
      })
    });

    const content = this.generateTsConfig(appPath, Array.from(compositionsFilesPaths));
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
    const tsconfigPath = this.writeTsconfig(context);
    const defaultConfig = await this.adapter.getDevWebpackConfig(context, tsconfigPath, this.webpackMain.logger, 'serve', {});

    const defaultTransformer: WebpackConfigTransformer = configMutator => configMutator.merge([defaultConfig]);
    const config = this.adapter.webpackConfigFactory(
      context.id, this.workspace.path, context.entry, context.rootPath, context.publicPath, this.webpackMain.pubsub, {}
    );
    const configMutator = new WebpackConfigMutator(config);
    const transformerContext: WebpackConfigTransformContext = {
      mode: 'dev',
    };
    const afterMutation = runTransformersWithContext(
      configMutator.clone(),
      [defaultTransformer, ...transformers],
      transformerContext
    );

    return new WebpackDevServer(afterMutation.raw as WebpackConfigWithDevServer, this.adapter.webpack, this.adapter.webpackDevServer);
  }
}

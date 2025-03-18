import { OutputHashing } from '@angular-devkit/build-angular';
import { ApplicationInternalOptions, getWorkspace, normalizePath } from "@bitdev/angular.dev-services.common";
import type { Bundler, BundlerContext, BundlerResult, Target } from '@teambit/bundler';
import type { Component } from '@teambit/component';
import { DependencyResolverAspect, type DependencyResolverMain } from '@teambit/dependency-resolver';
import { DevFilesAspect, type DevFilesMain } from "@teambit/dev-files";
import type { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import type { Logger } from '@teambit/logger';
import type { Workspace } from '@teambit/workspace';
import assert from "assert";
import fs from "fs-extra";
import { findScopePath } from '@teambit/scope.modules.find-scope-path';
import { join, posix, resolve } from "path";
import { buildApplication, BuildOutput } from "./application.bundler.js";
import { NgViteOptions } from "./utils/types.js";
import { fixEntries, generateAppTsConfig, generateMainEntryFile, readTsConfig } from "./utils/utils.js";

const DEFAULT_SERVER_NAME = 'ng-vite-dev-server';

export class NgViteBundler implements Bundler {
  idName: string;

  constructor(
    public id: string,
    private options: NgViteOptions & { bundlerContext: BundlerContext },
    private logger: Logger,
    private depsResolver: DependencyResolverMain,
    private devFilesMain: DevFilesMain,
    private workspace?: Workspace
  ) {
    this.idName = `bitdev.angular/${this.id}`;
  }

  getComponents(targets: Target[], outputPath: string): Component[] {
    const path = outputPath.substring(0, outputPath.lastIndexOf(posix.sep));
    const target = targets.find((targetCandidate) => path === targetCandidate.outputPath);

    assert(target, `Could not find target for path "${outputPath}"`);

    return target.components as any as Component[];
  }

  private getTempFolder(idName: string, path = process.cwd()): string {
    const scopePath = findScopePath(path);
    assert(scopePath, `Unable to find scope path`);
    const tempFolder = join(scopePath, 'tmp', 'preview-entries', idName);

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }
    return tempFolder;
  }

  async run(): Promise<BundlerResult[]> {
    const componentsOutput: BundlerResult[] = [];
    const targets = this.options.bundlerContext.targets;
    const startTime = Date.now();
    const longProcessLogger = this.logger.createLongProcessLogger('Running Angular ESBuild bundler', targets.length);
    // this.logger.console('bundling components');

    for (const target of targets) {
      const components = this.options.bundlerContext.components;
      const ids = components.map(component => component.id.toString()).join(', ');

      const fullMessage = `on ${components.length} component${components.length > 1 ? 's' : ''}`;
      longProcessLogger.logProgress(fullMessage);
      // this.logger.console(fullMessage);
      this.logger.debug(`${fullMessage}\ncomponents ids: ${ids}`);

      const output: Pick<BundlerResult, "assets" | "assetsByChunkName" | "entriesAssetsMap"> = {
        assets: [],
        assetsByChunkName: {},
        entriesAssetsMap: {},
      };

      // const tempFolder = this.getTempFolder(this.idName);
      const tempFolder = target.outputPath;
      const entries = fixEntries(tempFolder, target.entries as string[]);
      const mainEntryFile = generateMainEntryFile(this.options.appRootPath, tempFolder, [...entries, resolve(join(this.options.appRootPath, 'src', 'main'))]);

      const angularOptions: ApplicationInternalOptions = {
        baseHref: `./`,
        optimization: false,
        outputHashing: OutputHashing.None,
        browser: mainEntryFile,
        index: './src/index.html',
        tsConfig: 'tsconfig.app.json',
        assets: ['./src/favicon.ico', './src/assets'],
        styles: ['./src/styles.scss'],
        inlineStyleLanguage: "scss",
        ssr: false,
        // Disable the progress reporting with a loading spinner from Angular
        progress: false
      };

      const appTsConfigPath = join(this.options.appRootPath, angularOptions.tsConfig);
      const appTsConfig = readTsConfig(appTsConfigPath);
      const tsconfigPath = normalizePath(join(tempFolder, `tsconfig/tsconfig-${Date.now()}.json`));
      generateAppTsConfig(components, this.options.appRootPath, appTsConfig, tsconfigPath, this.depsResolver, this.workspace, [mainEntryFile], this.devFilesMain);

      const publicPath = join(target.outputPath, 'public');
      const results = await buildApplication({
        angularOptions: {
          ...angularOptions,
          tsConfig: tsconfigPath
        },
        outputPath: publicPath,
        sourceRoot: this.options.sourceRoot || 'src',
        workspaceRoot: this.options.appRootPath,
        logger: this.logger,
        tempFolder: tempFolder,
        isPreview: true
      }) as BuildOutput[];

      // Angular outputs the files into the public/browser folder, we need to move them to the root of the public folder
      for(const file of fs.readdirSync(join(publicPath, 'browser'))) {
        fs.moveSync(join(publicPath, 'browser', file), join(publicPath, file));
      }
      // remove the browser folder
      fs.removeSync(join(publicPath, 'browser'));

      const endTime = Date.now();

      componentsOutput.push({
        components,
        outputPath: join(target.outputPath, 'public'),
        ...output,
        errors: results.filter(result => !!result.error).map(result => result.error),
        warnings: [],
        startTime,
        endTime,
      } as any as BundlerResult);
    }

    longProcessLogger.end();

    return componentsOutput;
  }

  static from(options: NgViteOptions & { bundlerContext: BundlerContext }): AsyncEnvHandler<Bundler> {
    return async (context: EnvContext): Promise<Bundler> => {
      const name = options.name || DEFAULT_SERVER_NAME;
      const logger = context.createLogger(name);
      const depsResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
      const devFilesMain = context.getAspect<DevFilesMain>(DevFilesAspect.id);
      const workspace = getWorkspace(context);

      return new NgViteBundler(name, options, logger, depsResolver, devFilesMain, workspace);
    };
  }
}


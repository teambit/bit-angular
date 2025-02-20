import { OutputHashing } from '@angular-devkit/build-angular';
import {
  ApplicationInternalOptions,
  type DevServerOptions,
  getWorkspace,
  normalizePath
} from "@bitdev/angular.dev-services.common";
import type { DevServer, DevServerContext } from '@teambit/bundler';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { DevFilesAspect, DevFilesMain } from "@teambit/dev-files";
import type { AsyncEnvHandler, EnvContext } from '@teambit/envs';
import { Logger } from '@teambit/logger';
import { findScopePath } from '@teambit/scope.modules.find-scope-path';
import { Port } from '@teambit/toolbox.network.get-port';
import type { Workspace } from '@teambit/workspace';
import fs from "fs-extra";
import { Server } from 'http';
import assert from "node:assert";
import { join, resolve } from "path";
import { serveApplication } from "./application.dev-server.js";
import { NgViteOptions } from './utils/types.js';
import { fixEntries, generateAppTsConfig, generateMainEntryFile, getEnvFile } from "./utils/utils.js";

const DEFAULT_SERVER_NAME = 'ng-vite-dev-server';

export class NgViteDevServer implements DevServer {
  idName: string;

  constructor(
    public id: string,
    private options: NgViteOptions & { devServerContext: DevServerContext },
    private logger: Logger,
    private depsResolver: DependencyResolverMain,
    private devFilesMain: DevFilesMain,
    private workspace?: Workspace
  ) {
    this.idName = `bitdev.angular/${this.id}`;
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

  async listen(port: number): Promise<Server> {
    assert(this.workspace, 'Workspace is not defined');
    const tempFolder = this.getTempFolder(this.idName, this.workspace.path);
    const entries = fixEntries(tempFolder, this.options.devServerContext.entry);
    const mainEntryFile = generateMainEntryFile(this.options.appRootPath, tempFolder, [...entries, resolve(join(this.options.appRootPath, 'src', 'main'))]);

    const angularOptions: ApplicationInternalOptions & DevServerOptions = {
      baseHref: `/${this.options.devServerContext.rootPath}/`,
      optimization: false,
      outputHashing: OutputHashing.None,
      browser: mainEntryFile,
      index: './src/index.html',
      tsConfig: 'tsconfig.app.json',
      assets: ['./src/favicon.ico', './src/assets'],
      styles: ['./src/styles.scss'],
      inlineStyleLanguage: "scss",
      buildTarget: 'development',
      progress: false
    };
    const envVars = await getEnvFile('development', this.options.appRootPath);
    const appTsconfigPath = join(this.options.appRootPath, angularOptions.tsConfig);
    const tsconfigPath = normalizePath(join(tempFolder, `tsconfig/tsconfig-${Date.now()}.json`));
    const workspaceCmpsIDs = this.workspace.listIds();
    const components = await this.workspace.getMany(workspaceCmpsIDs);
    generateAppTsConfig(components, this.options.appRootPath, appTsconfigPath, tsconfigPath, this.depsResolver, this.workspace, [mainEntryFile], this.devFilesMain);

    // The returned Server is never used, so we can safely ignore the return type
    return await serveApplication({
      angularOptions: {
        ...angularOptions,
        tsConfig: tsconfigPath
      },
      sourceRoot: this.options.sourceRoot || 'src',
      workspaceRoot: this.options.appRootPath,
      port: port || (await Port.getPortFromRange([3000, 4000])),
      logger: this.logger,
      tempFolder: tempFolder,
      isPreview: true,
      envVars: {
        process: { env: envVars }
      }
    }) as any as Server;
  }

  static from(options: NgViteOptions & { devServerContext: DevServerContext }): AsyncEnvHandler<DevServer> {
    return async (context: EnvContext): Promise<DevServer> => {
      const name = options.name || DEFAULT_SERVER_NAME;
      const logger = context.createLogger(name);
      const depsResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
      const devFilesMain = context.getAspect<DevFilesMain>(DevFilesAspect.id);
      const workspace = getWorkspace(context);

      return new NgViteDevServer(name, options, logger, depsResolver, devFilesMain, workspace);
    };
  }
}


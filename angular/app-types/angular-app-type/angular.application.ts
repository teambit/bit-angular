import { VERSION } from '@angular/cli';
import { getWorkspace, NG_APP_NAME, normalizePath } from '@bitdev/angular.dev-services.common';
import { ApplicationBuilderOptions, SsrClass } from '@bitdev/angular.dev-services.ng-compat';
import { AngularVitePreview } from '@bitdev/angular.dev-services.preview.vite-preview';
import { buildApplication, generateAppTsConfig, getEnvFile, serveApplication } from '@bitdev/angular.dev-services.vite';
import {
  AppBuildContext,
  AppBuildResult,
  AppContext,
  Application,
  ApplicationInstance,
  DeployFn
} from '@teambit/application';
import { Bundler, BundlerContext, DevServerContext } from '@teambit/bundler';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { CACHE_ROOT } from '@teambit/legacy.constants';
import { Preview } from '@teambit/preview';
import { Port } from '@teambit/toolbox.network.get-port';
import { Workspace } from '@teambit/workspace';
import assert from 'assert';
import fs from 'fs-extra';
import { cloneDeep } from 'lodash-es';
import { join } from 'path';
import { AngularAppOptions } from './angular-app-options.js';

export class AngularApp implements Application {
  readonly name: string;
  readonly idName: string;
  readonly deploy?: DeployFn;

  constructor(
    readonly options: AngularAppOptions
  ) {
    this.name = options.name || NG_APP_NAME;
    this.idName = `bitdev.angular/${this.name}`;
    this.deploy = options.deploy;
  }

  readonly publicDir = 'public';

  private getTempFolder(workspace?: Workspace): string {
    const tempFolder = workspace?.getTempDir(this.idName) || join(CACHE_ROOT, this.idName);
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }
    return tempFolder;
  }

  private getTsconfigPath(tempFolder: string): string {
    return normalizePath(join(tempFolder, `tsconfig/tsconfig-${Date.now()}.json`));
  }

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

    return AngularVitePreview.from({
      angularServeOptions,
      angularBuildOptions,
      sourceRoot: this.options.sourceRoot
    });
  }

  /**
   * Transform the app context into env context to make typescript happy.
   * Technically, we only use methods that exist in both interfaces, so it's fine.
   */
  private getEnvContext(context: AppContext | AppBuildContext): EnvContext {
    return context as any as EnvContext;
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
    const workspaceCmpsIDs = workspace.listIds();
    const bitCmps = await workspace.getMany(workspaceCmpsIDs);
    const tempFolder = this.getTempFolder(workspace);
    const tsconfigPath = this.getTsconfigPath(tempFolder);
    generateAppTsConfig(bitCmps, appRootPath, appTsconfigPath, tsconfigPath, depsResolver, workspace);

    const envVars = await getEnvFile('development', appRootPath, context.envVariables as any);
    await serveApplication({
      angularOptions: {
        ...this.options.angularBuildOptions as ApplicationBuilderOptions,
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
    const appOptions = this.options.angularBuildOptions as ApplicationBuilderOptions;
    let entryServer: string | undefined;
    if ((appOptions.ssr as SsrClass)?.entry) {
      entryServer = (appOptions.ssr as SsrClass).entry;
    } else if (appOptions.ssr && Number(VERSION.major) >= 17 && Number(VERSION.major) < 19) {
      entryServer = './entry.server.ts';
    }
    const tempFolder = this.getTempFolder();
    const tsconfigPath = this.getTsconfigPath(tempFolder);
    generateAppTsConfig([capsule.component], appRootPath, appTsconfigPath, tsconfigPath, depsResolver, undefined, entryServer ? [entryServer] : undefined);

    const errors: Error[] = [];
    if (!this.options.bundler) {
      const envVars = await getEnvFile('production', appRootPath, context.envVariables);
      const results = await buildApplication({
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
      for (const result of results) {
        if (result.error) {
          errors.push(new Error(result.error));
        }
      }
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
      const results = await bundler.run();
      for (const result of results) {
        if (result.errors) {
          errors.push(...result.errors);
        }
      }
    }
    return {
      errors,
      artifacts: [{
        name: this.name,
        globPatterns: [outputPath],
      }],
      metadata: {
        outputPath,
        publicDir: join(outputPath, 'browser'),
        ssrPublicDir: appOptions.ssr ? join(outputPath, Number(VERSION.major) >= 19 ? 'server' : 'ssr') : undefined
      }
    };
  }

  static from(options: AngularAppOptions): Application {
    return new AngularApp(options);
  }
}

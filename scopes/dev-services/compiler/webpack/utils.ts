import { componentIsApp } from '@teambit/angular-apps';
import { AppBuildContext, AppContext, ApplicationMain } from '@teambit/application';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Component, ComponentID } from '@teambit/component';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { Logger } from '@teambit/logger';
import { PkgMain } from '@teambit/pkg';
import { WebpackConfigWithDevServer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { existsSync, mkdirSync, writeFileSync } from 'fs-extra';
import objectHash from 'object-hash';
import { join, posix, resolve } from 'path';
import { readConfigFile, sys } from 'typescript';
import { Configuration, WebpackPluginInstance } from 'webpack';


export type WebpackConfig = Configuration;

export type WebpackPlugin = WebpackPluginInstance;

export enum WebpackSetup {
  Serve = 'serve',
  Build = 'build',
}

export interface WebpackConfigFactoryOpts {
  tempFolder: string;
  context: DevServerContext | BundlerContext;
  tsConfigPath: string;
  rootPath: string;
  logger: Logger;
  setup: WebpackSetup;
  webpackOptions: Partial<WebpackConfigWithDevServer | Configuration>;
  angularOptions: any;
  sourceRoot?: string;
  entryFiles: string[];
  nodeModulesPaths: string[];
  workspaceDir: string;
  plugins: WebpackPluginInstance[];
  useNgcc: boolean;
}

const writeHash = new Map<string, string>();
const timestamp = Date.now();

export function getPreviewRootPath(workspace?: Workspace): string {
  try {
    const rootPath = workspace?.componentDir(ComponentID.fromString('teambit.angular/dev-services/preview/preview'), {
      ignoreScopeAndVersion: true,
      ignoreVersion: true
    }, { relative: false }) || '';
    return join(rootPath, 'preview-app');
  } catch (e) {
    return resolve(require.resolve('@teambit/angular-preview'), '../../preview-app/');
  }
}

export function isBuildContext(context: DevServerContext | BundlerContext): context is BundlerContext {
  return (context as BundlerContext).capsuleNetwork !== undefined;
}

export function isAppContext(context: DevServerContext | AppContext): context is DevServerContext & AppContext {
  return (context as any).appName !== undefined;
}

export function isAppBuildContext(
  context: BundlerContext | AppBuildContext
): context is BundlerContext & AppBuildContext {
  return (context as any).appName !== undefined;
}

/**
 * Add the list of files to include into the typescript compilation as absolute paths
 */
export function generateTsConfig(
  appPath: string,
  includePaths: string[],
  excludePaths: string[] = [],
  tsPaths: { [key: string]: string[] }
): string {
  const tsconfigPath = join(appPath, 'tsconfig.app.json');
  const tsconfigJSON = readConfigFile(tsconfigPath, sys.readFile).config;
  const pAppPath = pathNormalizeToLinux(appPath);

  // tsconfigJSON.config.angularCompilerOptions.enableIvy = this.enableIvy;
  tsconfigJSON.files = tsconfigJSON.files.map((file: string) => posix.join(pAppPath, file));
  tsconfigJSON.include = [
    ...tsconfigJSON.include.map((file: string) => posix.join(pAppPath, file)),
    ...includePaths.map((path) => posix.join(path, '**/*.ts'))
  ];
  tsconfigJSON.exclude = [
    ...tsconfigJSON.exclude.map((file: string) => posix.join(pAppPath, file)),
    ...excludePaths,
    ...includePaths.map((path) => posix.join(path, '**/*.spec.ts'))
  ];
  tsconfigJSON.compilerOptions.paths = tsPaths;

  return JSON.stringify(tsconfigJSON, undefined, 2);
}

/**
 * write a link to load custom modules dynamically.
 */
export function writeTsconfig(
  context: DevServerContext | BundlerContext,
  rootSpace: string,
  tempFolder: string,
  application: ApplicationMain,
  pkg: PkgMain,
  workspace?: Workspace
): string {
  const tsPaths: { [key: string]: string[] } = {};
  const includePaths = new Set<string>();
  const dirPath = join(tempFolder, context.id);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  // get the list of files for existing component compositions to include into the compilation
  context.components.forEach((component: Component) => {
    let outputPath: string;

    const isApp = componentIsApp(component, application);
    if (isApp) {
      return;
    }
    if (isBuildContext(context)) {
      const capsules = context.capsuleNetwork.graphCapsules;
      const capsule = capsules.getCapsule(component.id);
      if (!capsule) {
        throw new Error(`No capsule found for ${component.id} in network graph`);
      }
      outputPath = pathNormalizeToLinux(capsule.path);
    } else {
      outputPath = pathNormalizeToLinux(workspace?.componentDir(component.id, {
        ignoreScopeAndVersion: true,
        ignoreVersion: true
      }) || '');
    }
    // map the package names to the workspace component paths for typescript in case a package references another local package
    tsPaths[`${pkg.getPackageName(component)}`] = [`${outputPath}/public-api.ts`];
    tsPaths[`${pkg.getPackageName(component)}/*`] = [`${outputPath}/*`];

    includePaths.add(outputPath);
  });

  const content = generateTsConfig(rootSpace, Array.from(includePaths), [], tsPaths);
  const hash = objectHash(content);
  const targetPath = join(dirPath, `__tsconfig-${timestamp}.json`);

  // write only if link has changed (prevents triggering fs watches)
  if (writeHash.get(targetPath) !== hash) {
    writeFileSync(targetPath, content);
    writeHash.set(targetPath, hash);
  }

  return pathNormalizeToLinux(targetPath);
}

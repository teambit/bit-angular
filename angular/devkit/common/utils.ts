import { AppBuildContext, AppContext, ApplicationMain } from '@teambit/application';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Component, ComponentID } from '@teambit/component';
import { DevFilesMain } from '@teambit/dev-files';
import { EnvContext } from '@teambit/envs';
import { IsolatorMain } from '@teambit/isolator';
import { Logger } from '@teambit/logger';
import { PkgMain } from '@teambit/pkg';
import TesterAspect from '@teambit/tester';
import WorkspaceAspect, { Workspace } from '@teambit/workspace';
import { outputFileSync } from 'fs-extra';
// @ts-ignore
import normalize from 'normalize-path';
import objectHash from 'object-hash';
import { dirname, join, posix, resolve } from 'path';
import { readConfigFile, sys } from 'typescript';

export const NG_APP_NAME = 'ng-app';
export const NG_APP_PATTERN = `*.${ NG_APP_NAME }.*`;

export enum BundlerSetup {
  Serve = 'serve',
  Build = 'build',
}

export function componentIsApp(component: Component, application: ApplicationMain): boolean {
  // We first check if the component is registered as an app
  return !!application.listAppsById(component.id)
    // If it returns false, it might be because the app has never been compiled and has not been detected as an app yet
    // In this case we check all the existing files for the ng app pattern
    || component.filesystem.byGlob([NG_APP_PATTERN]).length > 0;
}

/**
 * Returns the workspace instance from the context, if it's available, or undefined otherwise.
 */
export function getWorkspace(context: EnvContext): Workspace | undefined {
  // TODO: replace this try catch with context.hasAspect once it's available from harmony
  try {
    return context.getAspect<Workspace>(WorkspaceAspect.id);
  } catch (err) {
    // Ignore this. We might be running not from within a workspace, for example, when using bit sign.
  }
  return undefined;
}

export function getNodeModulesPaths(build: boolean, isolator: IsolatorMain, workspace?: Workspace, capsuleOnly = false): string[] {
  const nodeModulesPaths: string[] = [];

  if (workspace) {
    const workspaceDir = workspace.path;
    const scopeAspectsRootDir = isolator.getCapsulesRootDir({ baseDir: workspace.scope.getAspectCapsulePath() });
    const workspaceCapsulesRootDir = build ? isolator.getCapsulesRootDir({ baseDir: workspace.path }) : undefined;

    const workspaceNodeModules = resolve(workspaceDir, 'node_modules');

    if (workspaceCapsulesRootDir) {
      const workspaceCapsuleNodeModules = resolve(workspaceCapsulesRootDir, 'node_modules');
      // Add the workspace capsule node modules
      nodeModulesPaths.push(workspaceCapsuleNodeModules);
    }

    // Check if we are in the aspects' capsule
    if (!__dirname.startsWith(workspaceNodeModules)) {
      const aspectsCapsuleNodeModules = resolve(scopeAspectsRootDir, 'node_modules');
      // Add the aspects capsule node modules
      nodeModulesPaths.push(aspectsCapsuleNodeModules);
    }

    // Add the workspace node modules
    if (!capsuleOnly) {
      nodeModulesPaths.push(workspaceNodeModules, 'node_modules');
    }
  }

  if (!nodeModulesPaths.includes('node_modules')) {
    nodeModulesPaths.push('node_modules');
  }

  return nodeModulesPaths;
}

/**
 * Returns the value of the option or its default value if undefined
 */
export function optionValue<T>(value: T | undefined, defaultValue: T) {
  return typeof value === 'undefined' ? defaultValue : value;
}

/**
 * This uses a dynamic import to load a module which may be ESM.
 * CommonJS code can load ESM code via a dynamic import. Unfortunately, TypeScript
 * will currently, unconditionally downlevel dynamic import into a require call.
 * require calls cannot load ESM code and will result in a runtime error. To work around
 * this, a Function constructor is used to prevent TypeScript from changing the dynamic import.
 * Once TypeScript provides support for keeping the dynamic import, this workaround can
 * be dropped.
 *
 * @param modulePath The path of the module to load.
 * @returns A Promise that resolves to the dynamically imported module.
 */
export async function loadEsmModule<T>(modulePath: string): Promise<T> {
  try {
    return await import(modulePath);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return new Function('modulePath', `return import(modulePath)`)(modulePath) as Promise<T>;
  }
}

export function cmpIdToPkgName(componentId: ComponentID) {
  const allSlashes = new RegExp('/', 'g');
  const name = componentId.fullName.replace(allSlashes, '.');
  const scope = componentId.scope.split('.').join('/');
  const partsToJoin = scope ? [scope, name] : [name];
  return `@${ partsToJoin.join('.') }`;
}

export function isBuildContext(context: DevServerContext | BundlerContext): context is BundlerContext {
  return (context as BundlerContext).capsuleNetwork !== undefined;
}

export function isAppDevContext(context: any): context is DevServerContext & AppContext {
  return (context as any).appName !== undefined;
}

export function isAppBuildContext(context: any): context is BundlerContext & AppBuildContext {
  return (context as any).appName !== undefined;
}

export function isAppContext<T>(context: any): context is T {
  return (context as any).appName !== undefined;
}


const writeHash = new Map<string, string>();
const timestamp = Date.now();

/**
 * Add the list of files to include in the typescript compilation as absolute paths
 */
export function generateTsConfig(
  appPath: string,
  includePaths: string[],
  excludePaths: string[] = [],
  tsPaths: { [key: string]: string[] }
): string {
  const tsconfigPath = join(appPath, 'tsconfig.app.json');
  const tsconfigJSON = readConfigFile(tsconfigPath, sys.readFile).config;
  const pAppPath = normalizePath(appPath);

  // tsconfigJSON.config.angularCompilerOptions.enableIvy = this.enableIvy;
  tsconfigJSON.files = tsconfigJSON.files?.map((file: string) => posix.join(pAppPath, file)) || [];
  tsconfigJSON.include = [
    ...tsconfigJSON.include.map((file: string) => posix.join(pAppPath, file)),
    ...includePaths.map((path) => posix.join(path, '**/*.ts'))
  ];
  tsconfigJSON.exclude = [
    ...tsconfigJSON.exclude.map((file: string) => posix.join(pAppPath, file)),
    ...excludePaths
  ];
  tsconfigJSON.compilerOptions.paths = tsPaths;

  return JSON.stringify(tsconfigJSON, undefined, 2);
}

/**
 * write a link to load custom modules dynamically.
 */
export function writeTsconfig(
  context: DevServerContext | BundlerContext,
  rootPath: string,
  tempFolder: string,
  application: ApplicationMain,
  pkg: PkgMain,
  devFilesMain: DevFilesMain,
  workspace?: Workspace
): string {
  const tsPaths: { [key: string]: string[] } = {};
  const includePaths = new Set<string>();
  const excludePaths = new Set<string>();
  const dirPath = join(tempFolder, context.id);

  // get the list of files for existing component compositions to include in the compilation
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
        throw new Error(`No capsule found for ${ component.id } in network graph`);
      }
      outputPath = normalizePath(capsule.path);
    } else {
      outputPath = normalizePath(workspace?.componentDir(component.id, {
        ignoreVersion: true
      }) || '');
    }
    // map the package names to the workspace component paths for typescript in case a package references another local package
    const pkgName = pkg.getPackageName(component);
    tsPaths[pkgName] = [`${ outputPath }/public-api.ts`];
    tsPaths[`${ pkgName }/*`] = [`${ outputPath }/*`];

    includePaths.add(outputPath);

    // get the list of spec patterns
    const devPatterns: string[] = devFilesMain.getDevPatterns(component, TesterAspect.id);
    devPatterns.forEach(specPattern => {
      excludePaths.add(posix.join(outputPath, specPattern));
    });
  });

  const content = generateTsConfig(rootPath, Array.from(includePaths), Array.from(excludePaths), tsPaths);
  const hash = objectHash(content);
  const targetPath = join(dirPath, `tsconfig/tsconfig-${ timestamp }.json`);

  // write only if the link has changed (prevents triggering fs watches)
  if (writeHash.get(targetPath) !== hash) {
    outputFileSync(targetPath, content);
    writeHash.set(targetPath, hash);
  }

  return normalizePath(targetPath);
}

export function dedupPaths(paths: (string | any)[]): string[] {
  return Array.from(new Set(paths.map(p => typeof p === 'string' ? posix.normalize(p) : p)));
}

/**
 * Returns the absolute path to a package or directory within a package.
 *
 * @param {string} packageName - The name of the package.
 * @param {string} [path=''] - The path to file or directory within the package. Defaults to an empty string.
 * @return {string} - The absolute path to the specified file or directory.
 */
export function packagePath(packageName: string, path = ''): string {
  return join(dirname(require.resolve(`${ packageName }/package.json`)), path);
}

/**
 * Normalize slashes in a file path to be posix/unix-like forward slashes.
 * Also condenses repeat slashes to a single slash and removes and trailing slashes, unless disabled.
 */
export function normalizePath(path: string = '', removeTrailingSlashes = false): string {
  return normalize(path, removeTrailingSlashes);
}

export function getLoggerApi(logger: Logger) {
  return {
    error: (m: string) => logger.consoleFailure(m),
    log: (m: string) => logger.console(m),
    warn: (m: string) => logger.consoleWarning(m),
    info: (m: string) => logger.console(m),
    colorMessage: (m: string) => logger.console(m),
    createChild: () => logger
  } as any;
}

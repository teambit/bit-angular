import { AppBuildContext, AppContext, ApplicationMain } from '@teambit/application';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Component, ComponentID } from '@teambit/component';
import { DevFilesMain } from '@teambit/dev-files';
import { EnvContext } from '@teambit/envs';
import { IsolatorMain } from '@teambit/isolator';
import { Logger } from '@teambit/logger';
import { PkgMain } from '@teambit/pkg';
import { TesterAspect } from '@teambit/tester';
import WorkspaceAspect, { Workspace } from '@teambit/workspace';
import { ScopeMain } from '@teambit/scope';
import { getRootComponentDir } from '@teambit/workspace.root-components';
import { outputFileSync } from 'fs-extra';
// @ts-ignore
import normalize from 'normalize-path';
import objectHash from 'object-hash';
import { dirname, join, posix, resolve } from 'path';

export const NG_APP_NAME = 'bit-app';
export const NG_APP_PATTERN = `*.${NG_APP_NAME}.*`;

export enum BundlerSetup {
  Serve = 'serve',
  Build = 'build',
}

/**
 * Normalize slashes in a file path to be posix/unix-like forward slashes.
 * Also condenses repeat slashes to a single slash and removes and trailing slashes, unless disabled.
 */
export function normalizePath(path: string = '', removeTrailingSlashes = false): string {
  return normalize(path, removeTrailingSlashes);
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
export function getWorkspace(context: EnvContext | AppContext): Workspace | undefined {
  // TODO: replace this try catch with context.hasAspect once it's available from harmony
  try {
    return context.getAspect<Workspace>(WorkspaceAspect.id);
  } catch (err) {
    // Ignore this. We might be running not from within a workspace, for example, when using bit sign.
  }
  return undefined;
}

function getRootComponentDirByRootId(rootComponentsPath: string, rootComponentId: ComponentID, workspace: Workspace): string {
  // Root directories for local envs and apps are created without their version number.
  // This is done to avoid changes to the lockfile after such components are tagged.
  const id = workspace.hasId(rootComponentId)
    ? rootComponentId.toStringWithoutVersion()
    : rootComponentId.toString();
  return getRootComponentDir(rootComponentsPath, id);
}

export function getNodeModulesPaths(build: boolean, isolator: IsolatorMain, envId: ComponentID, scope: ScopeMain, workspace?: Workspace, capsuleOnly = false): string[] {
  const nodeModulesPaths: string[] = [];

  const aspectsLoader = scope.getScopeAspectsLoader();
  const aspectsOpts = aspectsLoader.getIsolateOpts();

  if (workspace) {
    const workspaceDir = workspace.path;
    const scopeAspectsRootDir = isolator.getCapsulesRootDir({ baseDir: scope.getAspectCapsulePath() });
    const workspaceCapsulesRootDir = build ? isolator.getCapsulesRootDir({ baseDir: workspace.path }) : undefined;

    // Add the root components node modules (.bit_roots/env)
    const rootCmpDir = workspace.rootComponentsPath;
    const rootCmpEnvDir = getRootComponentDirByRootId(rootCmpDir, envId, workspace);
    nodeModulesPaths.push(resolve(rootCmpEnvDir, 'node_modules'));

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
  } else { // ripple, bit sign, ...
    const baseDir = scope.getAspectCapsulePath();
    // check dated-dirs (ripple only)
    const capsulesDatedDir = isolator.getCapsulesRootDir({
      baseDir,
      useDatedDirs: true,
      datedDirId: aspectsOpts.datedDirId
    });
    nodeModulesPaths.push(resolve(capsulesDatedDir, 'node_modules'));

    const capsulesDefaultDir = isolator.getCapsulesRootDir({ baseDir });
    nodeModulesPaths.push(resolve(capsulesDefaultDir, 'node_modules'));
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
  return `@${partsToJoin.join('.')}`;
}

export function isBuildContext(context: any): context is BundlerContext {
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
  pAppPath: string,
  tsConfigPath: string,
  includePaths: string[],
  excludePaths: string[] = [],
  tsPaths: { [key: string]: string[] }
): string {
  // default config to make the preview app work
  const tsconfigJSON = {
    extends: normalizePath(resolve(tsConfigPath)),
    compilerOptions: {
      paths: tsPaths
    },
    // eslint-disable-next-line
    files: ["./src/main.ts" /*, "./src/polyfills.ts"*/ ].map((file: string) => posix.join(pAppPath, file)),
    include: [
      ...["./src/app/**/*.ts"].map((file: string) => posix.join(pAppPath, file)),
      ...includePaths.map((path) => posix.join(path, '**/*.ts'))
    ],
    exclude: [
      ...["./src/app/**/*.spec.ts"].map((file: string) => posix.join(pAppPath, file)),
      ...excludePaths
    ]
  }

  return JSON.stringify(tsconfigJSON, undefined, 2);
}

/**
 * Generates the tsconfig to load the preview app with compositions dynamically.
 */
export async function writeTsconfig(
  context: DevServerContext | BundlerContext | AppContext | AppBuildContext,
  rootPath: string,
  tempFolder: string,
  application: ApplicationMain,
  pkg: PkgMain,
  devFilesMain: DevFilesMain,
  tsConfigPath?: string,
  workspace?: Workspace
): Promise<string> {
  const tsPaths: { [key: string]: string[] } = {};
  const includePaths = new Set<string>();
  const excludePaths = new Set<string>();
  const dirPath = join(tempFolder, context.id);

  let components: Component[];
  if (workspace) {
    const workspaceCmpsIDs = workspace.listIds();
    components = await workspace.getMany(workspaceCmpsIDs);
  } else {
    components = context.components;
  }

  // get the list of files for existing component compositions to include in the compilation
  // eslint-disable-next-line no-restricted-syntax
  for (const component of components) {
    // we only want angular components
    if (component.config.main === 'public-api.ts') {
      let outputPath: string;
      const isApp = componentIsApp(component, application);
      if (!isApp) {
        if (isBuildContext(context)) {
          // eslint-disable-next-line no-await-in-loop
          const capsule = context.capsuleNetwork.graphCapsules.getCapsule(component.id);
          if (!capsule) {
            // eslint-disable-next-line no-console
            console.warn(`No capsule found for ${component.id} in the network graph`);
            // eslint-disable-next-line no-continue
            continue;
          }
          outputPath = normalizePath(capsule.path);
        } else {
          outputPath = normalizePath(workspace?.componentDir(component.id, {
            ignoreVersion: true
          }) || '');
        }
        // map the package names to the workspace component paths for typescript in case a package references another local package
        const pkgName = pkg.getPackageName(component);
        tsPaths[pkgName] = [`${outputPath}/public-api.ts`];
        tsPaths[`${pkgName}/*`] = [`${outputPath}/*`];

        includePaths.add(outputPath);

        // get the list of spec patterns
        const devPatterns: string[] = devFilesMain.getDevPatterns(component, TesterAspect.id);
        devPatterns.forEach(specPattern => {
          excludePaths.add(posix.join(outputPath, specPattern));
        });
      }
    }
  }

  const pAppPath = normalizePath(rootPath);
  const tsConfigAppPath = tsConfigPath ?? join(rootPath, 'tsconfig.app.json');
  const content = generateTsConfig(pAppPath, tsConfigAppPath, Array.from(includePaths), Array.from(excludePaths), tsPaths);
  const hash = objectHash(content);
  const targetPath = join(dirPath, `tsconfig/tsconfig-${timestamp}.json`);

  // write only if the link has changed (prevents triggering fs watches)
  if (writeHash.get(targetPath) !== hash) {
    outputFileSync(targetPath, content);
    writeHash.set(targetPath, hash);
  }

  return normalizePath(targetPath);
}

export function dedupePaths(paths: (string | any)[]): string[] {
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
  return join(dirname(require.resolve(`${packageName}/package.json`)), path);
}

export function getLoggerApi(logger: Logger, isPreview = false) {
  return {
    // eslint-disable-next-line no-console
    error: (m: string) => console.error(m),
    log: (m: string) => !isPreview ? logger.console(m) : null,
    // ignoring the warning about the server to use only for testing
    // eslint-disable-next-line no-console
    warn: (m: string) => !m.match('This is a simple server') ? console.warn(m) : null,
    info: (m: string) => !isPreview ? logger.console(m) : null,
    // eslint-disable-next-line no-console
    colorMessage: (m: string) => console.log(m),
    createChild: () => logger
  } as any;
}

export function getSafeResolve(path: string, nodeModulesPaths?: string[]): string | undefined {
  try {
    return require.resolve(path, { paths: nodeModulesPaths });
  } catch (_e) {
    if (nodeModulesPaths) {
      try {
        return getSafeResolve(path);
      } catch (_e2) {
        return undefined;
      }
    }
    return undefined;
  }
}

export function getWebpackAngularAliases(nodeModulesPaths?: string[]): { [key: string]: string } {
  const aliases: { [key: string]: string } = {};

  [
    '@angular/build',
    '@angular/cdk',
    '@angular/core/schematics',
    '@angular/core/rxjs-interop',
    '@angular/core/primitives/signals',
    '@angular/core/primitives/event-dispatch',
    '@angular/core/testing',
    '@angular/core',
    '@angular/common/http',
    '@angular/common/locales',
    '@angular/common/testing',
    '@angular/common',
    '@angular/animations/browser',
    '@angular/animations',
    '@angular/cli',
    '@angular/compiler',
    '@angular/compiler-cli',
    '@angular/forms',
    '@angular/platform-browser/animations/async',
    '@angular/platform-browser/animations',
    '@angular/platform-browser/testing',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic/testing',
    '@angular/platform-browser-dynamic',
    '@angular/platform-server/init',
    '@angular/platform-server/testing',
    '@angular/platform-server',
    '@angular/router/upgrade',
    '@angular/router/testing',
    '@angular/router',
    '@angular/ssr/schematics',
    '@angular/ssr'
  ].forEach((pkg) => {
    const resolved = getSafeResolve(pkg, nodeModulesPaths);
    if (resolved) {
      aliases[pkg] = resolved;
    }
  });

  return aliases;
}

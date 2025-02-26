import { ApplicationOptions, normalizePath } from "@bitdev/angular.dev-services.common";
import { Component } from '@teambit/component';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { DevFilesMain } from '@teambit/dev-files';
import { TesterAspect } from '@teambit/tester';
import { Workspace } from '@teambit/workspace';
import assert from 'assert';
import fs from "fs-extra";
import { flatten } from 'lodash-es';
import objectHash from "object-hash";
import { basename, dirname, isAbsolute, join, relative } from "path";
import ts from 'typescript';


const writeHash = new Map<string, string>();
export const ENTRY_REGEXP = new RegExp(/(import\s.*['"])(.*)(@teambit(\/|\\\\).*['"];)/gm);
export interface JsonObject {
  [prop: string]: any;
}

export function generateMainEntryFile(appRootPath: string, tempFolder: string, entryPoints: string[]): string {
  const entryFileContent = entryPoints.map(entry => `import './${normalizePath(relative(tempFolder, entry.endsWith('.ts') ? entry.replace(/\.ts$/, '') : entry))}';`).join('\n');
  const entryFile = join(tempFolder, `main-${objectHash.MD5(entryFileContent)}.ts`);
  fs.outputFileSync(entryFile, entryFileContent);
  return normalizePath(relative(appRootPath, entryFile));
}

/**
 * We need to move the entries to `.git/bit/tmp/preview-entries/<env-id>`
 * out of `node_modules` since Vite doesn't support entries in it.
 */
export function fixEntries(tempFolder: string, entries: string[]) {
  return entries.filter(entry => !!entry.match(/(compositions-\d*\.js|overview-\d*\.js|preview\.root.*\.js|preview\.entry.*\.js)/))
    .map(entry => {
      const name = `${objectHash.MD5(entry)}-${basename(entry)}`;
      const newEntry = join(tempFolder, name);
      let content = fs.readFileSync(entry, 'utf8');
      content = content.replaceAll(ENTRY_REGEXP, '$1$3').replaceAll(/\\\\/gm, '/');
      // content = content.replaceAll("@teambit/preview/dist/preview.preview.runtime.js", "@teambit/preview/dist/preview-modules.js");
      fs.outputFileSync(newEntry, content);
      return newEntry;
    });
}


/**
 * Takes a tsconfig.json file, a list of component directories, and returns a new tsconfig.json file with the include
 * and exclude properties expanded to include all the component directories
 * @param {any} tsconfigJSON - The path to the existing tsconfig.json file.
 * @param {string} targetPath - The path to the new tsconfig.json file.
 * @param {string[]} compDirs - An array of paths to the component directories.
 * @returns the tsConfig object.
 */
export function expandIncludeExclude(tsconfigJSON: JsonObject, targetPath: string, compDirs: string[]): JsonObject {
  // eslint-disable-next-line no-param-reassign
  targetPath = dirname(targetPath);

  if (tsconfigJSON.include) {
    // eslint-disable-next-line no-param-reassign
    tsconfigJSON.include = flatten(
      tsconfigJSON.include.map((includedPath: string) => {
        return compDirs.map((compDir: string) => {
          return isAbsolute(includedPath) ? normalizePath(includedPath) : `${normalizePath(relative(targetPath, compDir))}/${includedPath}`;
        });
      })
    );
  }
  if (tsconfigJSON.exclude) {
    // eslint-disable-next-line no-param-reassign
    tsconfigJSON.exclude = flatten(
      tsconfigJSON.exclude.map((excludedPath: string) => {
        return compDirs.map((compDir: string) => {
          return isAbsolute(excludedPath) ? normalizePath(excludedPath) : `${normalizePath(relative(targetPath, compDir))}/${excludedPath}`;
        });
      })
    );
  }
  if (tsconfigJSON.files) {
    // eslint-disable-next-line no-param-reassign
    tsconfigJSON.files = flatten(
      tsconfigJSON.files.map((filesPath: string) => {
        return compDirs.map((compDir: string) => {
          return isAbsolute(filesPath) ? normalizePath(relative(targetPath, filesPath)) : `${normalizePath(relative(targetPath, compDir))}/${filesPath}`;
        });
      })
    );
  }

  return tsconfigJSON;
}


export function getIndexInputFile(index: ApplicationOptions['index']): string {
  assert(index, 'No index file provided');
  if (typeof index === 'string') {
    return index;
  }
  return (index as any).input;
}

export function generateAppTsConfig(
  bitCmps: Component[],
  appRootPath: string,
  appTsconfigPath: string,
  tsconfigPath: string,
  depsResolver: DependencyResolverMain,
  workspace?: Workspace,
  additionalEntries?: string[],
  devFilesMain?: DevFilesMain
): void {
  const configFile = ts.readConfigFile(appTsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw configFile.error;
  }
  const tsconfigJSON: JsonObject = configFile.config;
  // Add the paths to tsconfig to remap bit components to local folders
  tsconfigJSON.compilerOptions = tsconfigJSON.compilerOptions || {};
  tsconfigJSON.compilerOptions.paths = tsconfigJSON.compilerOptions.paths || {};
  bitCmps.forEach((dep: Component) => {
    let componentDir = workspace?.componentDir(dep.id, {
      ignoreVersion: true
    });
    if (componentDir && dep.config.main === 'public-api.ts' || componentDir === appRootPath) {
      componentDir = normalizePath(componentDir);
      const pkgName = depsResolver.getPackageName(dep);
      tsconfigJSON.compilerOptions.paths[pkgName] = [`${componentDir}/${dep.config.main}`, `${componentDir}`];
      tsconfigJSON.compilerOptions.paths[`${pkgName}/*`] = [`${componentDir}/*`];
      if (devFilesMain) {
        tsconfigJSON.include.push(`${componentDir}/**/*`);

        // get the list of spec patterns
        const devPatterns: string[] = devFilesMain.getDevPatterns(dep, TesterAspect.id);
        devPatterns.forEach(specPattern => {
          tsconfigJSON.exclude.push(`${componentDir}/${specPattern}`);
        });
      }
    }
  });

  if (additionalEntries) {
    tsconfigJSON.files.push(...additionalEntries);
  }

  const tsconfigContent = expandIncludeExclude(tsconfigJSON, tsconfigPath, [appRootPath]);
  const hash = objectHash(tsconfigContent);
  // write only if link has changed (prevents triggering fs watches)
  if (writeHash.get(tsconfigPath) !== hash) {
    fs.outputJsonSync(tsconfigPath, tsconfigContent, { spaces: 2 });
    writeHash.set(tsconfigPath, hash);
  }
}

export async function getEnvFile(mode: string, rootDir: string, overrides?: Record<string, string>) {
  const vite = await import('vite');
  const dotenv = vite.loadEnv(mode, rootDir);
  return {
    ...overrides,
    ...dotenv
  };
}

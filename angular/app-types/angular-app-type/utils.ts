import { ApplicationOptions, normalizePath } from '@bitdev/angular.dev-services.common';
import assert from 'assert';
import { flatten } from 'lodash';
import { dirname, relative } from 'path';

export interface JsonObject {
  [prop: string]: any;
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
          const compDirRelative = normalizePath(relative(targetPath, compDir));
          return `${compDirRelative}/${includedPath}`;
        });
      })
    );
  }
  if (tsconfigJSON.exclude) {
    // eslint-disable-next-line no-param-reassign
    tsconfigJSON.exclude = flatten(
      tsconfigJSON.exclude.map((excludedPath: string) => {
        return compDirs.map((compDir: string) => {
          const compDirRelative = normalizePath(relative(targetPath, compDir));
          return `${compDirRelative}/${excludedPath}`;
        });
      })
    );
  }
  if (tsconfigJSON.files) {
    // eslint-disable-next-line no-param-reassign
    tsconfigJSON.files = flatten(
      tsconfigJSON.files.map((filesPath: string) => {
        return compDirs.map((compDir: string) => {
          const compDirRelative = normalizePath(relative(targetPath, compDir));
          return `${compDirRelative}/${filesPath}`;
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

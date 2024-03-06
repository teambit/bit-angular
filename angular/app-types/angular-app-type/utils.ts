import { ApplicationOptions, normalizePath } from '@bitdev/angular.dev-services.common';
import assert from 'assert';
import { flatten } from 'lodash-es';
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

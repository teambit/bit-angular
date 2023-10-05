import { pathNormalizeToLinux } from "@teambit/legacy/dist/utils";
import { flatten } from 'lodash';
import { relative, dirname } from 'path';

/**
 * Takes a tsconfig.json file, a list of component directories, and returns a new tsconfig.json file with the include
 * and exclude properties expanded to include all the component directories
 * @param {any} tsconfigJSON - The path to the existing tsconfig.json file.
 * @param {string} targetPath - The path to the new tsconfig.json file.
 * @param {string[]} compDirs - An array of paths to the component directories.
 * @returns the tsConfig object.
 */
export function expandIncludeExclude(tsconfigJSON: any, targetPath: string, compDirs: string[]): string {
  // eslint-disable-next-line no-param-reassign
  targetPath = dirname(targetPath);

  if (tsconfigJSON.include) {
    // eslint-disable-next-line no-param-reassign
    tsconfigJSON.include = flatten(
      tsconfigJSON.include.map((includedPath: string) => {
        return compDirs.map((compDir: string) => {
          const compDirRelative = pathNormalizeToLinux(relative(targetPath, compDir));
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
          const compDirRelative = pathNormalizeToLinux(relative(targetPath, compDir));
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
          const compDirRelative = pathNormalizeToLinux(relative(targetPath, compDir));
          return `${compDirRelative}/${filesPath}`;
        });
      })
    );
  }

  return JSON.stringify(tsconfigJSON, undefined, 2);
}

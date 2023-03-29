import { ApplicationMain } from "@teambit/application";
import { Component } from "@teambit/component";
import { pathNormalizeToLinux } from "@teambit/legacy/dist/utils";
import { flatten } from 'lodash';
import { relative, dirname } from 'path';

export const NG_APP_NAME = 'ng-app';
export const NG_APP_PATTERN = `*.${NG_APP_NAME}.*`;

export function componentIsApp(component: Component, application: ApplicationMain): boolean {
  // We first check if the component is registered as an app
  return !!application.getApp(component.id.name)
    // If it returns false, it might be because the app has never been compiled and has not been detected as an app yet
    // In this case we check all the existing files for the ng app pattern
    || component.filesystem.byGlob([NG_APP_PATTERN]).length > 0;
}

/**
 * Takes a tsconfig.json file, a list of component directories, and returns a new tsconfig.json file with the include
 * and exclude properties expanded to include all the component directories
 * @param {any} tsconfigJSON - The path to the existing tsconfig.json file.
 * @param {string} targetPath - The path to the new tsconfig.json file.
 * @param {string[]} compDirs - An array of paths to the component directories.
 * @returns the tsConfig object.
 */
export function expandIncludeExclude(tsconfigJSON: any, targetPath: string, compDirs: string[]): string {
  targetPath = dirname(targetPath);

  if (tsconfigJSON.include) {
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

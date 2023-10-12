/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parse} from 'path';
// import { ScriptElement, StyleElement } from '@angular-devkit/build-angular/src/builders/browser/schema';
import type { BrowserBuilderOptions } from '@angular-devkit/build-angular';

export type EntryPointsType = [name: string, isModule: boolean, inject: boolean];

type Flatten<T> = T extends any[] ? T[number] : T;
export type ScriptElement = NonNullable<Flatten<BrowserBuilderOptions['scripts']>>;
export type StyleElement = NonNullable<Flatten<BrowserBuilderOptions['styles']>>;

export type NormalizedEntryPoint = Required<Exclude<ScriptElement | StyleElement, string>>;

export function normalizeExtraEntryPoints(
  extraEntryPoints: (ScriptElement | StyleElement)[],
  defaultBundleName: string,
): NormalizedEntryPoint[] {
  return extraEntryPoints.map((entry) => {
    if(!entry) {
      throw new Error('Empty entry point found.');
    }

    if (typeof entry === 'string') {
      return { input: entry || '', inject: true, bundleName: defaultBundleName };
    }

    const { inject = true, ...newEntry } = entry;
    let bundleName;
    if (entry.bundleName) {
      bundleName = entry.bundleName;
    } else if (!inject) {
      // Lazy entry points use the file name as bundle name.
      bundleName = parse(entry.input).name;
    } else {
      bundleName = defaultBundleName;
    }

    return { ...newEntry, inject, bundleName };
  });
}

export function generateEntryPoints(options: {
  main: string;
  polyfills?: string[] | string;
  styles: StyleElement[];
  scripts: ScriptElement[];
  isHMREnabled?: boolean;
}): EntryPointsType[] {
  // Add all styles/scripts, except lazy-loaded ones.
  const extraEntryPoints = (
    eePoints: (ScriptElement | StyleElement)[],
    defaultBundleName: string,
  ) => {
    const entryPoints = normalizeExtraEntryPoints(eePoints, defaultBundleName)
      .filter((entry) => entry.inject)
      .map((entry) => entry.input);

    // remove duplicates
    return [...new Set(entryPoints)].map<EntryPointsType>((f) => [f, defaultBundleName === 'scripts', defaultBundleName === 'scripts']);
  };

  let polyfills: EntryPointsType[] = [];
  if(options.polyfills) {
    polyfills = Array.isArray(options.polyfills) ? options.polyfills.map((p: string) => [p, true, false]) : [[options.polyfills, true, false]];
  }
  const entryPoints: EntryPointsType[] = [
    ...polyfills,
    ...extraEntryPoints(options.styles, 'styles'),
    ...extraEntryPoints(options.scripts, 'scripts'),
    [options.main, true, false],
  ];

  const duplicates = entryPoints.filter(
    ([name]) => entryPoints[0].indexOf(name) !== entryPoints[0].lastIndexOf(name),
  );

  if (duplicates.length > 0) {
    throw new Error(`Multiple bundles have been named the same: '${duplicates.join(`', '`)}'.`);
  }

  return entryPoints;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of *a part* of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 * See: https://github.com/angular/angular-cli/blob/12.2.x/packages/ngtools/webpack/src/ngcc_processor.ts
 */

import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { accessSync, constants, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import type { Compiler } from 'webpack';
import { ResolverWithOptions, tryResolvePackage } from './utils';

export type InputFileSystem = Compiler['inputFileSystem'];

// We cannot create a plugin for this, because NGTSC requires addition type
// information which ngcc creates when processing a package which was compiled with NGC.

// Example of such errors:
// ERROR in node_modules/@angular/platform-browser/platform-browser.d.ts(42,22):
// error TS-996002: Appears in the NgModule.imports of AppModule,
// but could not be resolved to an NgModule class

// We now transform a package and it's typings when NGTSC is resolving a module.

export class NgccProcessor {
  constructor(
    private readonly propertiesToConsider: string[],
    private readonly compilationWarnings: (Error | string)[],
    private readonly compilationErrors: (Error | string)[],
    private readonly tsConfigPath: string,
    private readonly inputFileSystem: InputFileSystem,
    private readonly resolver: ResolverWithOptions,
  ) {}

  /** Process the entire node modules tree. */
  process(nodeModulesDirectory: string) {
    // Skip if node_modules are read-only
    const corePackage = tryResolvePackage(this.resolver,'@angular/core', nodeModulesDirectory);
    if (corePackage && isReadOnlyFile(corePackage)) {
      return;
    }

    // Perform a ngcc run check to determine if an initial execution is required.
    // If a run hash file exists that matches the current package manager lock file and the
    // project's tsconfig, then an initial ngcc run has already been performed.
    let skipProcessing = false;
    let runHashFilePath: string | undefined;
    const runHashBasePath = path.join(nodeModulesDirectory, '.cli-ngcc');
    const projectBasePath = path.join(nodeModulesDirectory, '..');
    try {
      let lockData;
      let lockFile = 'yarn.lock';
      try {
        lockData = readFileSync(path.join(projectBasePath, lockFile));
      } catch {
        lockFile = 'package-lock.json';
        lockData = readFileSync(path.join(projectBasePath, lockFile));
      }

      let ngccConfigData;
      try {
        ngccConfigData = readFileSync(path.join(projectBasePath, 'ngcc.config.js'));
      } catch {
        ngccConfigData = '';
      }

      const relativeTsconfigPath = path.relative(projectBasePath, this.tsConfigPath);
      const tsconfigData = readFileSync(this.tsConfigPath);

      // Generate a hash that represents the state of the package lock file and used tsconfig
      const runHash = createHash('sha256')
        .update(lockData)
        .update(lockFile)
        .update(ngccConfigData)
        .update(tsconfigData)
        .update(relativeTsconfigPath)
        .digest('hex');

      // The hash is used directly in the file name to mitigate potential read/write race
      // conditions as well as to only require a file existence check
      runHashFilePath = path.join(runHashBasePath, runHash + '.lock');

      // If the run hash lock file exists, then ngcc was already run against this project state
      if (existsSync(runHashFilePath)) {
        skipProcessing = true;
      }
    } catch {
      // Any error means an ngcc execution is needed
    }

    if (skipProcessing) {
      return;
    }


    // We spawn instead of using the API because:
    // - NGCC Async uses clustering which is problematic when used via the API which means
    // that we cannot setup multiple cluster masters with different options.
    // - We will not be able to have concurrent builds otherwise Ex: App-Shell,
    // as NGCC will create a lock file for both builds and it will cause builds to fails.
    const { status, error } = spawnSync(
      process.execPath,
      [
        require.resolve('@angular/compiler-cli/ngcc/main-ngcc.js'),
        '--source' /** basePath */,
        nodeModulesDirectory,
        '--properties' /** propertiesToConsider */,
        ...this.propertiesToConsider,
        '--first-only' /** compileAllFormats */,
        '--create-ivy-entry-points' /** createNewEntryPointFormats */,
        '--async',
        '--tsconfig' /** tsConfigPath */,
        this.tsConfigPath,
        '--use-program-dependencies',
      ],
      {
        stdio: ['inherit', process.stderr, process.stderr],
      },
    );

    if (status !== 0) {
      const errorMessage = error?.message || '';
      throw new Error(errorMessage + `NGCC failed${errorMessage ? ', see above' : ''}.`);
    }

    // ngcc was successful so if a run hash was generated, write it for next time
    if (runHashFilePath) {
      try {
        if (!existsSync(runHashBasePath)) {
          mkdirSync(runHashBasePath, { recursive: true });
        }
        writeFileSync(runHashFilePath, '');
      } catch {
        // Errors are non-fatal
      }
    }
  }
}

function isReadOnlyFile(fileName: string): boolean {
  try {
    accessSync(fileName, constants.W_OK);

    return false;
  } catch {
    return true;
  }
}

export function initializeNgccProcessor(
  compiler: Compiler,
  tsconfig: string,
): { processor: NgccProcessor; errors: string[]; warnings: string[] } {
  const { inputFileSystem, options: webpackOptions } = compiler;
  const mainFields = webpackOptions.resolve?.mainFields?.flat() ?? [];

  const errors: string[] = [];
  const warnings: string[] = [];
  const resolver = compiler.resolverFactory.get('normal', {
    // Caching must be disabled because it causes the resolver to become async after a rebuild
    cache: false,
    extensions: ['.json'],
    useSyncFileSystemCalls: true,
  });
  const processor = new NgccProcessor(
    mainFields,
    warnings,
    errors,
    tsconfig,
    inputFileSystem,
    resolver,
  );

  return { processor, errors, warnings };
}

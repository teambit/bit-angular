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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs-extra';
import * as path from 'path';


// We cannot create a plugin for this, because NGTSC requires addition type
// information which ngcc creates when processing a package which was compiled with NGC.

// Example of such errors:
// ERROR in node_modules/@angular/platform-browser/platform-browser.d.ts(42,22):
// error TS-996002: Appears in the NgModule.imports of AppModule,
// but could not be resolved to an NgModule class

// We now transform a package and it's typings when NGTSC is resolving a module.

export class NgccProcessor {
  lockFile?: string;
  lockData?: string;
  runHashFilePath?: string;

  getLockFile(projectBasePath: string): { lockData: string, lockFile: string } {
    let lockFile: string;
    let lockData: string;

    if (this.lockFile && this.lockData) {
      lockFile = this.lockFile;
      lockData = this.lockData;
    } else {
      const LOCK_FILES = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];
      if (existsSync(path.join(projectBasePath, LOCK_FILES[0]))) {
        lockFile = LOCK_FILES[0];
      } else if (existsSync(path.join(projectBasePath, LOCK_FILES[1]))) {
        lockFile = LOCK_FILES[1];
      } else {
        lockFile = LOCK_FILES[2];
      }
      lockData = readFileSync(path.join(projectBasePath, lockFile), { encoding: 'utf8' });
    }

    return {
      lockData,
      lockFile
    };
  }

  needsProcessing(workspaceDir: string, tempFolder: string, nodeModulesPath: string[]): boolean {
    // Perform a ngcc run check to determine if an initial execution is required.
    // If a run hash file exists that matches the current package manager lock file and the
    // project's tsconfig, then an initial ngcc run has already been performed.
    try {
      const { lockData, lockFile } = this.getLockFile(workspaceDir);

      // Generate a hash that represents the state of the package lock file and used tsconfig
      const runHash = createHash('sha256')
        .update(lockData)
        .update(lockFile)
        .update(nodeModulesPath.join(':'))
        .digest('hex');

      // The hash is used directly in the file name to mitigate potential read/write race
      // conditions as well as to only require a file existence check
      this.runHashFilePath = path.join(tempFolder, runHash + '.lock');

      // If the run hash lock file exists, then ngcc was already run against this project state
      if (existsSync(this.runHashFilePath)) {
        return false;
      }
    } catch {
      // Any error means an ngcc execution is needed
    }
    return true;
  }

  process(modulePath: string, tempFolder?: string) {
    if(!existsSync(modulePath)) {
      return;
    }
    // We spawn instead of using the API because:
    // - NGCC Async uses clustering which is problematic when used via the API which means
    // that we cannot setup multiple cluster masters with different options.
    // - We will not be able to have concurrent builds otherwise Ex: App-Shell,
    // as NGCC will create a lock file for both builds and it will cause builds to fails.
    // this.resolver.resolveSync({}, )
    const mainNgcc = require.resolve('@angular/compiler-cli/ngcc').replace('index.js', 'main-ngcc.js')
    const { status, error } = spawnSync(
      process.execPath,
      [
        mainNgcc,
        '--source' /** path to the module to compile */,
        modulePath,
        '--first-only' /** compileAllFormats */,
        '--create-ivy-entry-points' /** createNewEntryPointFormats */,
        '--async',
        'false',
        '--no-tsconfig' /** don't use tsconfig */
      ],
      {
        stdio: ['inherit', process.stderr, process.stderr]
      }
    );

    if (status !== 0) {
      const errorMessage = error?.message || '';
      throw new Error(errorMessage + `NGCC failed${errorMessage ? ', see above' : ''}.`);
    }

    // ngcc was successful so if a run hash was generated, write it for next time
    if (this.runHashFilePath && tempFolder) {
      try {
        if (!existsSync(tempFolder)) {
          mkdirSync(tempFolder, { recursive: true });
        }
        writeFileSync(this.runHashFilePath, '');
        this.runHashFilePath = undefined;
      } catch {
        // Errors are non-fatal
      }
    }
  }
}

import * as cacache from 'cacache';
import { createHash } from 'crypto';
import { readFile } from './fs';
import { ngCompilerCli } from './ng-compiler-cli';

let aspectVersion: string | undefined; // TODO get version from aspect
// try {
//   aspectVersion = require('../../package.json').version;
// } catch {
//   // dev path
//   aspectVersion = require('../../../package.json').version;
// }

let compilerCliVersion: string | undefined;

export async function generateKey(...valuesToConsider: string[]): Promise<string> {
  if (compilerCliVersion === undefined) {
    compilerCliVersion = (await ngCompilerCli()).VERSION.full;
  }

  return createHash('sha1')
    .update(aspectVersion || '')
    .update(compilerCliVersion!)
    .update(valuesToConsider.join(':'))
    .digest('hex');
}

export async function readCacheEntry(cachePath: string, key: string): Promise<any | undefined> {
  const entry = await cacache.get.info(cachePath, key);
  if (entry) {
    return JSON.parse(await readFile(entry.path, 'utf8'));
  }

  return undefined;
}

export async function saveCacheEntry(cachePath: string, key: string, content: string): Promise<void> {
  await cacache.put(cachePath, key, content);
}

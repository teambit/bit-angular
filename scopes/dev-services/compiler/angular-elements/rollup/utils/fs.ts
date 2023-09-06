import * as fs from 'fs';
import { dirname } from 'path';
import { promisify } from 'util';

export const {readFile, writeFile, access, mkdir, stat} = fs.promises;
// @ts-ignore
export const rmdir = fs.promises.rm ?? fs.promises.rmdir;

export async function exists(path: fs.PathLike): Promise<boolean> {
  try {
    await access(path, fs.constants.F_OK);

    return true;
  } catch {
    return false;
  }
}

const cpFile = promisify(fs.copyFile);
export async function copyFile(src: string, dest: string): Promise<void> {
  const dir = dirname(dest);
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }

  await cpFile(src, dest, fs.constants.COPYFILE_FICLONE);
}

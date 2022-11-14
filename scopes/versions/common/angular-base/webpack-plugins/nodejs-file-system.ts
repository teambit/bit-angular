import * as fs from 'fs';
import * as p from 'path';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * A `string` representing a specific type of path, with a particular brand `B`.
 *
 * A `string` is not assignable to a `BrandedPath`, but a `BrandedPath` is assignable to a `string`.
 * Two `BrandedPath`s with different brands are not mutually assignable.
 */
export type BrandedPath<B extends string> = string&{
  _brand: B;
};

/**
 * A fully qualified path in the file system, in POSIX form.
 */
export type AbsoluteFsPath = BrandedPath<'AbsoluteFsPath'>;

/**
 * A path that's relative to another (unspecified) root.
 *
 * This does not necessarily have to refer to a physical file.
 */
export type PathSegment = BrandedPath<'PathSegment'>;

/**
 * An abstraction over the path manipulation aspects of a file-system.
 */
export interface PathManipulation {
  extname(path: AbsoluteFsPath|PathSegment): string;
  isRoot(path: AbsoluteFsPath): boolean;
  isRooted(path: string): boolean;
  dirname<T extends PathString>(file: T): T;
  join<T extends PathString>(basePath: T, ...paths: string[]): T;
  /**
   * Compute the relative path between `from` and `to`.
   *
   * In file-systems that can have multiple file trees the returned path may not actually be
   * "relative" (i.e. `PathSegment`). For example, Windows can have multiple drives :
   * `relative('c:/a/b', 'd:/a/c')` would be `d:/a/c'.
   */
  relative<T extends PathString>(from: T, to: T): PathSegment|AbsoluteFsPath;
  basename(filePath: string, extension?: string): PathSegment;
  normalize<T extends PathString>(path: T): T;
  resolve(...paths: string[]): AbsoluteFsPath;
  pwd(): AbsoluteFsPath;
  chdir(path: AbsoluteFsPath): void;
}

/**
 * An abstraction over the read-only aspects of a file-system.
 */
export interface ReadonlyFileSystem extends PathManipulation {
  exists(path: AbsoluteFsPath): boolean;
  readFile(path: AbsoluteFsPath): string;
  readFileBuffer(path: AbsoluteFsPath): Uint8Array;
  readdir(path: AbsoluteFsPath): PathSegment[];
  lstat(path: AbsoluteFsPath): FileStats;
  stat(path: AbsoluteFsPath): FileStats;
  realpath(filePath: AbsoluteFsPath): AbsoluteFsPath;
}

/**
 * A basic interface to abstract the underlying file-system.
 *
 * This makes it easier to provide mock file-systems in unit tests,
 * but also to create clever file-systems that have features such as caching.
 */
export interface FileSystem extends ReadonlyFileSystem {
  writeFile(path: AbsoluteFsPath, data: string|Uint8Array, exclusive?: boolean): void;
  removeFile(path: AbsoluteFsPath): void;
  symlink(target: AbsoluteFsPath, path: AbsoluteFsPath): void;
  copyFile(from: AbsoluteFsPath, to: AbsoluteFsPath): void;
  moveFile(from: AbsoluteFsPath, to: AbsoluteFsPath): void;
  ensureDir(path: AbsoluteFsPath): void;
  removeDeep(path: AbsoluteFsPath): void;
}

export type PathString = string|AbsoluteFsPath|PathSegment;

/**
 * Information about an object in the FileSystem.
 * This is analogous to the `fs.Stats` class in Node.js.
 */
export interface FileStats {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}


/**
 * A wrapper around the Node.js file-system that supports path manipulation.
 */
export class NodeJSPathManipulation implements PathManipulation {
  pwd(): AbsoluteFsPath {
    return this.normalize(process.cwd()) as AbsoluteFsPath;
  }
  chdir(dir: AbsoluteFsPath): void {
    process.chdir(dir);
  }
  resolve(...paths: string[]): AbsoluteFsPath {
    return this.normalize(p.resolve(...paths)) as AbsoluteFsPath;
  }

  dirname<T extends string>(file: T): T {
    return this.normalize(p.dirname(file)) as T;
  }
  join<T extends string>(basePath: T, ...paths: string[]): T {
    return this.normalize(p.join(basePath, ...paths)) as T;
  }
  isRoot(path: AbsoluteFsPath): boolean {
    return this.dirname(path) === this.normalize(path);
  }
  isRooted(path: string): boolean {
    return p.isAbsolute(path);
  }
  relative<T extends PathString>(from: T, to: T): PathSegment|AbsoluteFsPath {
    return this.normalize(p.relative(from, to)) as PathSegment | AbsoluteFsPath;
  }
  basename(filePath: string, extension?: string): PathSegment {
    return p.basename(filePath, extension) as PathSegment;
  }
  extname(path: AbsoluteFsPath|PathSegment): string {
    return p.extname(path);
  }
  normalize<T extends string>(path: T): T {
    // Convert backslashes to forward slashes
    return path.replace(/\\/g, '/') as T;
  }
}

/**
 * A wrapper around the Node.js file-system that supports readonly operations and path manipulation.
 */
export class NodeJSReadonlyFileSystem extends NodeJSPathManipulation implements ReadonlyFileSystem {

  exists(path: AbsoluteFsPath): boolean {
    return fs.existsSync(path);
  }
  readFile(path: AbsoluteFsPath): string {
    return fs.readFileSync(path, 'utf8');
  }
  readFileBuffer(path: AbsoluteFsPath): Uint8Array {
    return fs.readFileSync(path);
  }
  readdir(path: AbsoluteFsPath): PathSegment[] {
    return fs.readdirSync(path) as PathSegment[];
  }
  lstat(path: AbsoluteFsPath): FileStats {
    return fs.lstatSync(path);
  }
  stat(path: AbsoluteFsPath): FileStats {
    return fs.statSync(path);
  }
  realpath(path: AbsoluteFsPath): AbsoluteFsPath {
    return this.resolve(fs.realpathSync(path));
  }
}

/**
 * A wrapper around the Node.js file-system (i.e. the `fs` package).
 */
export class NodeJSFileSystem extends NodeJSReadonlyFileSystem implements FileSystem {
  writeFile(path: AbsoluteFsPath, data: string|Uint8Array, exclusive = false): void {
    fs.writeFileSync(path, data, exclusive ? {flag: 'wx'} : undefined);
  }
  removeFile(path: AbsoluteFsPath): void {
    fs.unlinkSync(path);
  }
  symlink(target: AbsoluteFsPath, path: AbsoluteFsPath): void {
    fs.symlinkSync(target, path);
  }
  copyFile(from: AbsoluteFsPath, to: AbsoluteFsPath): void {
    fs.copyFileSync(from, to);
  }
  moveFile(from: AbsoluteFsPath, to: AbsoluteFsPath): void {
    fs.renameSync(from, to);
  }
  ensureDir(path: AbsoluteFsPath): void {
    const parents: AbsoluteFsPath[] = [];
    while (!this.isRoot(path) && !this.exists(path)) {
      parents.push(path);
      path = this.dirname(path);
    }
    while (parents.length) {
      this.safeMkdir(parents.pop()!);
    }
  }
  removeDeep(path: AbsoluteFsPath): void {
    fs.rmdirSync(path, {recursive: true});
  }

  private safeMkdir(path: AbsoluteFsPath): void {
    try {
      fs.mkdirSync(path);
    } catch (err) {
      // Ignore the error, if the path already exists and points to a directory.
      // Re-throw otherwise.
      if (!this.exists(path) || !this.stat(path).isDirectory()) {
        throw err;
      }
    }
  }
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// eslint-disable-next-line max-classes-per-file
import { normalizePath } from '@bitdev/angular.dev-services.common';
import type { Compiler } from 'webpack';
import { NodeJSFileSystem } from './nodejs-file-system';

interface ResourceData {
  entryPoint: string;
  relativePath: string;
  resource: string;
  packageName?: string;
  packageVersion?: string;
  packagePath: string;
  entryPointPackageData?: EntryPointPackageJson;
}

export interface DedupeModuleResolvePluginOptions {
  verbose?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResourceData(resolveData: any): ResourceData {
  const { descriptionFileData, relativePath, descriptionFileRoot } = resolveData.createData?.resourceResolveData || resolveData.resourceResolveData;

  return {
    entryPoint: resolveData.request,
    packageName: descriptionFileData?.name,
    packageVersion: descriptionFileData?.version,
    relativePath,
    packagePath: normalizePath(descriptionFileRoot),
    resource: resolveData.createData?.resource || resolveData.resource,
    entryPointPackageData: descriptionFileData
  };
}

export class MockLogger {
  logs: { [P in Exclude<keyof any, 'level'>]: string[][] } = {
    debug: [],
    info: [],
    warn: [],
    error: []
  };

  debug(...args: string[]) {
    this.logs.debug.push(args);
  }

  info(...args: string[]) {
    this.logs.info.push(args);
  }

  warn(...args: string[]) {
    this.logs.warn.push(args);
  }

  error(...args: string[]) {
    this.logs.error.push(args);
  }
}

export interface PackageJsonFormatPropertiesMap {
  browser?: string;
  fesm2015?: string;
  fesm2020?: string;
  fesm2022?: string;
  fesm5?: string;
  es2015?: string;  // if exists then it is actually FESM2015
  es2020?: string;
  es2022?: string;
  esm2015?: string;
  esm2020?: string;
  esm2022?: string;
  esm5?: string;
  main?: string;     // UMD
  module?: string;   // if exists then it is actually FESM5
  types?: string;    // Synonymous to `typings` property - see https://bit.ly/2OgWp2H
  typings?: string;  // TypeScript .d.ts files
  node?: string;
  default?: string;
}
export type PackageJsonFormatProperties = keyof PackageJsonFormatPropertiesMap;

export type EntryPointJsonProperty = Exclude<PackageJsonFormatProperties, 'types'|'typings'>;
// We need to keep the elements of this const and the `EntryPointJsonProperty` type in sync.
export const SUPPORTED_FORMAT_PROPERTIES: EntryPointJsonProperty[] =
  ['fesm2022', 'fesm2020', 'fesm2015', 'fesm5', 'es2022', 'es2015', 'es2020', 'es2015', 'esm2022', 'esm2020', 'esm2015', 'esm5', 'main', 'module', 'browser'];

const OLD_ANGULAR_FORMATS: EntryPointJsonProperty[] = ['fesm2020', 'fesm2015', 'fesm5'];
const POST_IVY_ANGULAR_FORMATS: PackageJsonFormatProperties[] = ['types', 'esm2020', 'es2020', 'es2015', 'default'];
const V16_ANGULAR_FORMATS: PackageJsonFormatProperties[] = ['types', 'fesm2022', 'es2022', 'default'];

export type JsonPrimitive = string|number|boolean|null;
export type JsonValue = JsonPrimitive|Array<JsonValue>|JsonObject|undefined;
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * The properties that may be loaded from the `package.json` file.
 */
export interface EntryPointPackageJson extends JsonObject, PackageJsonFormatPropertiesMap {
  name: string;
  version?: string;
  scripts?: Record<string, string>;
  __processed_by_ivy_ngcc__?: Record<string, string>;
}

/**
 * DedupeModuleResolvePlugin is a webpack plugin which dedupes modules with the same name and versions
 * that are laid out in different parts of the node_modules tree.
 *
 * This is needed because Webpack relies on package managers to hoist modules and doesn't have any deduping logic.
 *
 * This is similar to how Webpack's 'NormalModuleReplacementPlugin' works
 * @see https://github.com/webpack/webpack/blob/4a1f068828c2ab47537d8be30d542cd3a1076db4/lib/NormalModuleReplacementPlugin.js#L9
 */
export class BitDedupeModuleResolvePlugin {
  modules = new Map<string, { request: string; resource: string }>();

  typings = new Map<string, string>();

  pluginName = 'BitDedupeModuleResolvePlugin';

  private fs = new NodeJSFileSystem();

  constructor(private nodeModulesPaths: string[], private workspaceDir: string, private tempFolder: string) {
  }

  guessTypingsFromPackageJson(
    fs: any, entryPointPath: string,
    entryPointPackageJson: EntryPointPackageJson): string|null {
    const cached = this.typings.get(entryPointPath);
    if(cached) {
      return cached;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const prop of SUPPORTED_FORMAT_PROPERTIES) {
      const field = entryPointPackageJson[prop];
      // Some packages have things like arrays in these fields!
      if (typeof field === 'string') {
        const relativeTypingsPath = field.replace(/\.js$/, '.d.ts');
        const typingsPath = fs.resolve(entryPointPath, relativeTypingsPath);
        if (fs.exists(typingsPath)) {
          this.typings.set(entryPointPath, typingsPath);
          return typingsPath;
        }
      }
    }
    return null;
  }

  isCompiledByAngular(packageName: string, packagePath: string, packageVersion: string, entryPointPath: string, entryPointPackageJson?: EntryPointPackageJson): boolean {
    if(!entryPointPackageJson) {
      return false;
    }
    if(entryPointPackageJson.exports && (entryPointPackageJson as any).exports['.']) {
      // eslint-disable-next-line no-param-reassign
      entryPointPackageJson = (entryPointPackageJson as any).exports['.'] as EntryPointPackageJson;
    }
    const typings = entryPointPackageJson?.typings
      || entryPointPackageJson.types
      || this.guessTypingsFromPackageJson(this.fs, entryPointPath, entryPointPackageJson);
    if (typeof typings !== 'string') {
      // Missing the required `typings` property
      return false;
    }

    // An entry-point is assumed to be compiled by Angular if there is either:
    // * files processed by ngcc
    // * one of the angular formats in package.json
    // * a `metadata.json` file next to the typings entry-point
    if(entryPointPackageJson.__processed_by_ivy_ngcc__ !== undefined
      || OLD_ANGULAR_FORMATS.some(f => Object.keys(entryPointPackageJson as JsonObject).includes(f))
      || POST_IVY_ANGULAR_FORMATS.every(f => Object.keys(entryPointPackageJson as JsonObject).includes(f))
      || V16_ANGULAR_FORMATS.every(f => Object.keys(entryPointPackageJson as JsonObject).includes(f))
    ) {
      return true;
    }
      const metadataPath = this.fs.resolve(entryPointPath, `${typings.replace(/\.d\.ts$/, '')  }.metadata.json`);
      return this.fs.exists(metadataPath);

  }

  getIssuer(result: any) {
    return result.contextInfo?.issuer || result.resourceResolveData?.context?.issuer;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(
      this.pluginName,
        // @ts-ignore
      (compilation, { normalModuleFactory }) => {
        normalModuleFactory.hooks.afterResolve.tap(this.pluginName, (result: any) => {
          if (
            // Ignore empty requests
            !result.request
            // Relative or absolute requests are not mapped
            || result.request.startsWith('.') || result.request.startsWith('/') || result.request.match(/^.:(\/|\\\\)/)
            // Ignore all webpack special requests
            || result.request.startsWith('!')
            // Only work on Javascript/TypeScript issuers.
            || !this.getIssuer(result)?.match(/\.[jt]sx?$/)
          ) {
            return;
          }


          const { packageName, packageVersion, resource, packagePath, entryPoint, entryPointPackageData } = getResourceData(result);

          // Empty name or versions are no valid primary entry points of a library
          if (!packageName || !packageVersion) {
            return;
          }

          const moduleId = entryPoint || packageName;
          const prevResolvedModule = this.modules.get(moduleId);

          // If this is the first time we visit this module.
          if (!prevResolvedModule) {
            // Only deal with Angular libraries
            const entryPointPath = packagePath.replace(packageName, entryPoint);
            const isCompiledByAngular = this.isCompiledByAngular(packageName, packagePath, packageVersion, entryPointPath, entryPointPackageData);
            if(!isCompiledByAngular) {
              return
            }

            // Add it to cache
            this.modules.set(moduleId, {
              resource,
              request: result.request
            });

            return;
          }

          const { resource: prevResource, request: prevRequest } = prevResolvedModule;
          if (resource === prevResource) {
            // No deduping needed.
            // The Current path and previously resolved path are the same.
            return;
          }

          // Alter current request with previously resolved module.
          const createData = result.createData as { resource: string; userRequest: string };
          createData.resource = prevResource;
          createData.userRequest = prevRequest;
        });
      }
    );
  }
}

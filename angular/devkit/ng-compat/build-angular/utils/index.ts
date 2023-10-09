import { json, logging } from '@angular-devkit/core';
import { VERSION } from '@angular/cli';
import { BrowserBuilderSchema } from '../browser-schema';

export * from './normalize-cache';
export * from './package-chunk-sort';
export * from './webpack-browser-config';

export let normalizeBrowserSchema: (workspaceRoot: string, projectRoot: string, projectSourceRoot: string | undefined, options: typeof BrowserBuilderSchema, metadata?: json.JsonObject, logger?: logging.LoggerApi) => any;
export let normalizeOptimization: (optimization?: any) => any;
export let BuildBrowserFeatures: any;

if (VERSION.major) {
  const utils = require('@angular-devkit/build-angular/src/utils');
  normalizeBrowserSchema = utils.normalizeBrowserSchema;
  normalizeOptimization = utils.normalizeOptimization;
  BuildBrowserFeatures = utils.BuildBrowserFeatures;
}

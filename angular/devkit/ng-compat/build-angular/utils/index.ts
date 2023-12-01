/* eslint-disable */
import { json, logging } from '@angular-devkit/core';
import { VERSION } from '@angular/cli';
import { BrowserBuilderOptions } from '../builder-options';

export * from './normalize-cache';
export * from './package-chunk-sort';
export * from './webpack-browser-config';

export let normalizeBrowserSchema: (workspaceRoot: string, projectRoot: string, projectSourceRoot: string | undefined, options: BrowserBuilderOptions, metadata?: json.JsonObject, logger?: logging.LoggerApi) => any;
export let normalizeOptimization: (optimization?: any) => any;
export let BuildBrowserFeatures: any;

if (VERSION.major) {
  const utils = require('@angular-devkit/build-angular/src/utils');
  normalizeBrowserSchema = utils.normalizeBrowserSchema;
  normalizeOptimization = utils.normalizeOptimization;
  BuildBrowserFeatures = utils.BuildBrowserFeatures;
}

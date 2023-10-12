/* eslint-disable */
import { logging } from '@angular-devkit/core';
import { VERSION } from '@angular/cli';
import { Configuration } from '@teambit/webpack';
import { BrowserBuilderSchema } from '../browser-schema';

type wbConfigFn = (
  workspaceRoot: string,
  projectRoot: string,
  sourceRoot: string | undefined,
  projectName: string,
  options: any,
  webpackPartialGenerator: any,
  logger: logging.LoggerApi,
  extraBuildOptions: Partial<any>
) => Promise<Configuration>;

type wbConfigFnV12 = (
  workspaceRoot: string,
  projectRoot: string,
  sourceRoot: string | undefined,
  options: any,
  webpackPartialGenerator: any,
  logger: logging.LoggerApi,
  extraBuildOptions: Partial<any>
) => Promise<Configuration>;

export let generateWebpackConfig: wbConfigFn & wbConfigFnV12;
export let getIndexOutputFile: (index: typeof BrowserBuilderSchema['index']) => string;

if (VERSION.major) {
  const webpackBrowserConfig = require('@angular-devkit/build-angular/src/utils/webpack-browser-config');
  generateWebpackConfig = webpackBrowserConfig.generateWebpackConfig;
  getIndexOutputFile = webpackBrowserConfig.getIndexOutputFile;
}

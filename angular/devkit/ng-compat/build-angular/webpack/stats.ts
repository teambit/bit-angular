import { WebpackLoggingCallback } from '@angular-devkit/build-webpack';
import { logging } from '@angular-devkit/core';
import { VERSION } from '@angular/cli';
import { BrowserBuilderSchema } from '../browser-schema';

export let createWebpackLoggingCallback: (options: typeof BrowserBuilderSchema, logger: logging.LoggerApi) => WebpackLoggingCallback;

if ((VERSION.major === '16' && Number(VERSION.minor) >= 2) || Number(VERSION.major) > 16) {
  createWebpackLoggingCallback = require('@angular-devkit/build-angular/src/tools/webpack/utils/stats').createWebpackLoggingCallback;
} else {
  createWebpackLoggingCallback = require('@angular-devkit/build-angular/src/webpack/utils/stats').createWebpackLoggingCallback;
}

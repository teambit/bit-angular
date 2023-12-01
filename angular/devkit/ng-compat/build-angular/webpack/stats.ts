/* eslint-disable */
import { WebpackLoggingCallback } from '@angular-devkit/build-webpack';
import { logging } from '@angular-devkit/core';
import { VERSION } from '@angular/cli';
import { BrowserBuilderOptions } from '../builder-options';

export let createWebpackLoggingCallback: (options: BrowserBuilderOptions, logger: logging.LoggerApi) => WebpackLoggingCallback;

if ((VERSION.major === '16' && Number(VERSION.minor) >= 2) || Number(VERSION.major) > 16) {
  createWebpackLoggingCallback = require('@angular-devkit/build-angular/src/tools/webpack/utils/stats').createWebpackLoggingCallback;
} else {
  createWebpackLoggingCallback = require('@angular-devkit/build-angular/src/webpack/utils/stats').createWebpackLoggingCallback;
}

import { createWebpackLoggingCallback } from '@angular-devkit/build-angular/src/webpack/utils/stats';
import { logging } from '@angular-devkit/core';
import type { Compiler, Configuration, Stats } from 'webpack';

interface WebpackLoggingCallback {
  (stats: Stats, config: Configuration): void;
}

const PLUGIN_NAME = 'angular-stats-logger-plugin';

export class StatsLoggerPlugin {
  loggingCallback: WebpackLoggingCallback;
  constructor() {
    // eslint-disable-next-line no-console
    const logger = {
      ...console
    };
    this.loggingCallback = createWebpackLoggingCallback({} as any, logger as any) as any as WebpackLoggingCallback
  }
  apply(compiler: Compiler) {
    // "Executed when the compilation has completed."
    compiler.hooks.done.tap(PLUGIN_NAME, (stats: Stats) => {
      this.loggingCallback(stats, {stats: {logging: 'info', colors: true}});
    });
  }
}

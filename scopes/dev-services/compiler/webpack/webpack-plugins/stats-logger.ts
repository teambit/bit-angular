import type { Compiler, Configuration, Stats } from 'webpack';
import { loadEsmModule } from '@teambit/angular-common';

interface WebpackLoggingCallback {
  (stats: Stats, config: Configuration): void;
}

const PLUGIN_NAME = 'angular-stats-logger-plugin';

export class StatsLoggerPlugin {
  async apply(compiler: Compiler) {
    // eslint-disable-next-line no-console
    const logger = {
      ...console
    };
    // "Executed when the compilation has completed."
    const { createWebpackLoggingCallback } = await loadEsmModule<typeof import('@angular-devkit/build-angular/src/webpack/utils/stats')>('@angular-devkit/build-angular/src/webpack/utils/stats');
    const loggingCallback = createWebpackLoggingCallback({} as any, logger as any) as any;
    compiler.hooks.done.tap(PLUGIN_NAME, (stats: Stats) => {
      loggingCallback(stats, {stats: {logging: 'info', colors: true}});
    });
  }
}

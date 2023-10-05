import type { Compiler, Stats } from 'webpack';
import { loadEsmModule } from '@bitdev/angular.dev-services.common';

const PLUGIN_NAME = 'angular-stats-logger-plugin';

export class StatsLoggerPlugin {
  async apply(compiler: Compiler) {
    // eslint-disable-next-line no-console
    const logger = {
      ...console
    };
    try {
      // "Executed when the compilation has completed."
      try {
        const { createWebpackLoggingCallback } = await loadEsmModule('@angular-devkit/build-angular/src/webpack/utils/stats') as any;
        const loggingCallback = createWebpackLoggingCallback({} as any, logger as any) as any;
        compiler.hooks.done.tap(PLUGIN_NAME, (stats: Stats) => {
          loggingCallback(stats, { stats: { logging: 'info', colors: true } });
        });
      } catch (e) {
        // angular v16+
        try {
          const { createWebpackLoggingCallback } = await loadEsmModule('@angular-devkit/build-angular/src/tools/webpack/utils/stats') as any;
          const loggingCallback = createWebpackLoggingCallback({} as any, logger as any) as any;
          compiler.hooks.done.tap(PLUGIN_NAME, (stats: Stats) => {
            loggingCallback(stats, { stats: { logging: 'info', colors: true } });
          });
        } catch (e) {}
      }
    } catch (e) {
      // if it fails, just continue (we don't need logging to break the build)
    }
  }
}

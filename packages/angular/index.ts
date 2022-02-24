export { AngularWebpack, WebpackSetup, BrowserOptions, DevServerOptions } from './angular.webpack';
export { AngularEnv } from './angular.env';
export { BitDedupeModuleResolvePlugin } from './webpack-plugins/angular-resolver';
export { NgccProcessor } from './webpack-plugins/ngcc-processor';
export { StatsLoggerPlugin } from './webpack-plugins/stats-logger'
export { AngularMain } from './angular.main.runtime';
export * from './utils';
export * from './apps';
export type { AngularDeps } from './angular.main.runtime';

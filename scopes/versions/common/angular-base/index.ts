export { AngularBaseWebpack, WebpackSetup, WebpackConfig, WebpackPlugin, WebpackBuildConfigFactory, WebpackServeConfigFactory } from './angular-base.webpack';
export { AngularBaseEnv } from './angular-base.env';
export type { AngularEnvOptions } from '@teambit/angular-apps';
export { BitDedupeModuleResolvePlugin } from './webpack-plugins/angular-resolver';
export { NgccProcessor } from '@teambit/ngcc';
export { StatsLoggerPlugin } from './webpack-plugins/stats-logger'
export { AngularBaseMain } from './angular-base.main.runtime';
export * from './utils';

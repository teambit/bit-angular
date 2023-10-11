import type { Configuration } from 'webpack';
import { VERSION } from '@angular/cli';

type configFn = (wco: any) => Promise<Configuration> | Configuration;
let configs: any;
if ((VERSION.major === '16' && Number(VERSION.minor) >= 2) || Number(VERSION.major) > 16) {
  // 16.2+
  configs = require('@angular-devkit/build-angular/src/tools/webpack/configs');
} else {
  configs = require('@angular-devkit/build-angular/src/webpack/configs');
}

export const getCommonConfig: configFn = configs.getCommonConfig;
export const getDevServerConfig: configFn = configs.getDevServerConfig;
export const getStylesConfig: configFn = configs.getStylesConfig;

// Angular v12, undefined for other versions
export const getBrowserConfig: configFn = configs.getBrowserConfig;
export const getStatsConfig: (wco: any) => { stats: any } = configs.getStatsConfig;
export const getTypeScriptConfig: configFn = configs.getTypeScriptConfig;

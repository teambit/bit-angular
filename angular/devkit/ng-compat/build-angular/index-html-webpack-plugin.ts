import { VERSION } from '@angular/cli';

export let IndexHtmlWebpackPlugin: any;
if ((VERSION.major === '16' && Number(VERSION.minor) >= 2) || Number(VERSION.major) > 16) {
  // 16.2+
  IndexHtmlWebpackPlugin = require('@angular-devkit/build-angular/src/tools/webpack/plugins/index-html-webpack-plugin').IndexHtmlWebpackPlugin;
} else {
  IndexHtmlWebpackPlugin = require('@angular-devkit/build-angular/src/webpack/plugins/index-html-webpack-plugin').IndexHtmlWebpackPlugin;
}

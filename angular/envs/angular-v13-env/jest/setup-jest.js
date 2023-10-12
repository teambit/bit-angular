/* eslint-disable */
require('jest-preset-angular/build/utils/reflect-metadata');
require('zone.js');
require('zone.js/bundles/zone-testing.umd');
const getTestBed = require('@angular/core/testing').getTestBed;
const BrowserDynamicTestingModule = require('@angular/platform-browser-dynamic/testing').BrowserDynamicTestingModule;
const platformBrowserDynamicTesting = require('@angular/platform-browser-dynamic/testing')
  .platformBrowserDynamicTesting;
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

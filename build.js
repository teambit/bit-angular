const resolve = require('path').resolve;
const ngPackagr = require('ng-packagr').ngPackagr;

const ngPackagePath = resolve('my-scope/bit-test/package.json');

const packagr = ngPackagr();
packagr.forProject(ngPackagePath);
packagr.build();

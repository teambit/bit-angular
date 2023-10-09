import { VERSION } from '@angular/cli';

export let BrowserBuilderSchema: any;

if (Number(VERSION.major) > 12) {
  BrowserBuilderSchema = require('@angular-devkit/build-angular/src/builders/browser/schema').Schema;
}

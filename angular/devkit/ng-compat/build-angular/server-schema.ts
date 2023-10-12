/* eslint-disable */
import { VERSION } from '@angular/cli';

export let OutputHashing: any;

if (VERSION.major === '12') {
  OutputHashing = require('@angular-devkit/build-angular/src/server/schema').OutputHashing;
}

/* eslint-disable */
import { VERSION } from '@angular/cli';
import { json } from '@angular-devkit/core';


export let normalizeCacheOptions: (metadata: json.JsonObject, worspaceRoot: string) => any;
if (Number(VERSION.major) > 12) {
  normalizeCacheOptions = require('@angular-devkit/build-angular/src/utils/normalize-cache').normalizeCacheOptions;
}

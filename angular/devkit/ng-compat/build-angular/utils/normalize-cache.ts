/* eslint-disable */
import { json } from '@angular-devkit/core';

export let normalizeCacheOptions: (metadata: json.JsonObject, worspaceRoot: string) => any
  = require('@angular-devkit/build-angular/src/utils/normalize-cache').normalizeCacheOptions;

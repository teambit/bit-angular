import { VERSION } from '@angular/cli';

export let generateEntryPoints: (options: {
  styles: any[];
  scripts: any[];
  isHMREnabled?: boolean;
}) => any[];

if (VERSION.major) {
  generateEntryPoints = require('@angular-devkit/build-angular/src/utils/package-chunk-sort').generateEntryPoints;
}

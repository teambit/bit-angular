/* eslint-disable */
import type { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { VERSION } from '@angular/cli';
import type { OutputFile, Plugin } from 'esbuild';
import { ApplicationBuilderOptions } from '../schemas/application.schema';

export let buildApplicationInternal = (
  options: ApplicationBuilderOptions,
  context: BuilderContext & {
    signal?: AbortSignal;
  },
  infrastructureSettings?: {
    write?: boolean;
  },
  plugins?: Plugin[] | { codePlugins: Plugin[], indexHtmlTransformer: any }
  // @ts-ignore
) => AsyncIterable<BuilderOutput & {
  outputFiles?: OutputFile[];
  assetFiles?: {
    source: string;
    destination: string;
  }[];
}>;

if (Number(VERSION.major) >= 16) {
  buildApplicationInternal = require('@angular-devkit/build-angular/src/builders/application').buildApplicationInternal;
}

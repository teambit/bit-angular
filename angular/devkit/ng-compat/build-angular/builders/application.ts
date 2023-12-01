import { ApplicationBuilderOptions } from '../schemas/application.schema';
import type { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import type { Plugin, OutputFile } from 'esbuild';
import { VERSION } from '@angular/cli';

export let buildApplicationInternal = (
  options: ApplicationBuilderOptions,
  context: BuilderContext & {
    signal?: AbortSignal;
  }, infrastructureSettings?: {
    write?: boolean;
  }, plugins?: Plugin[]
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

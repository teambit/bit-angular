/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import { join } from 'path';
import { EntryPointsType } from './package-chunk-sort';
import { stripBom } from './strip-bom';
import { CrossOriginValue, augmentIndexHtml } from './augment-index-html';

type IndexHtmlGeneratorPlugin = (
  html: string,
  options: IndexHtmlGeneratorProcessOptions,
) => Promise<string | IndexHtmlTransformResult>;

export type HintMode = 'prefetch' | 'preload' | 'modulepreload' | 'preconnect' | 'dns-prefetch';

export interface IndexHtmlGeneratorProcessOptions {
  lang: string | undefined;
  baseHref: string | undefined;
  hints?: { url: string; mode: HintMode; as?: string }[];
}

export interface IndexHtmlGeneratorOptions {
  rootPath: string;
  indexPath: string;
  deployUrl?: string;
  entrypoints: EntryPointsType[];
  crossOrigin?: CrossOriginValue;
}

export interface IndexHtmlTransformResult {
  content: string;
  warnings: string[];
  errors: string[];
}

export class IndexHtmlGenerator {
  private readonly plugins: IndexHtmlGeneratorPlugin[];

  constructor(readonly options: IndexHtmlGeneratorOptions) {
    this.plugins = [
      augmentIndexHtmlPlugin(this)
    ];
  }

  async process(options: IndexHtmlGeneratorProcessOptions): Promise<IndexHtmlTransformResult> {
    let content = stripBom(await this.readIndex(join(this.options.rootPath, this.options.indexPath)));
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const plugin of this.plugins) {
      const result = await plugin(content, options);
      if (typeof result === 'string') {
        content = result;
      } else {
        content = result.content;

        if (result.warnings.length) {
          warnings.push(...result.warnings);
        }

        if (result.errors.length) {
          errors.push(...result.errors);
        }
      }
    }

    return {
      content,
      warnings,
      errors,
    };
  }

  protected async readIndex(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf-8');
  }
}

function augmentIndexHtmlPlugin(generator: IndexHtmlGenerator): IndexHtmlGeneratorPlugin {
  const { deployUrl, crossOrigin, entrypoints } = generator.options;

  return async (html, options) => {
    const { lang, baseHref, hints } = options;

    return augmentIndexHtml({
      html,
      baseHref,
      deployUrl,
      crossOrigin,
      lang,
      entrypoints,
      hints,
    });
  };
}

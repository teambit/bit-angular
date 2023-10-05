/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { extname } from 'path';
import { htmlRewritingStream } from './html-rewriting-stream';
import { loadEsmModule } from '@bitdev/angular.dev-services.common';
import { EntryPointsType } from './package-chunk-sort';

export type CrossOriginValue = 'none' | 'anonymous' | 'use-credentials';

export interface AugmentIndexHtmlOptions {
  /* Input contents */
  html: string;
  baseHref?: string;
  deployUrl?: string;
  /** crossorigin attribute setting of elements that provide CORS support */
  crossOrigin?: CrossOriginValue;
  /** Used to sort the insertion of files in the HTML file */
  entrypoints: EntryPointsType[];
  /** Used to set the document default locale */
  lang?: string;
  hints?: { url: string; mode: string; as?: string }[];
}

/*
 * Helper function used by the IndexHtmlWebpackPlugin.
 * Can also be directly used by builder, e.g. in order to generate an index.html
 * after processing several configurations in order to build different sets of
 * bundles for differential serving.
 */
export async function augmentIndexHtml(
  params: AugmentIndexHtmlOptions,
): Promise<{ content: string; warnings: string[]; errors: string[] }> {
  const { entrypoints, deployUrl = '', lang, baseHref, html } = params;

  const warnings: string[] = [];
  const errors: string[] = [];

  let { crossOrigin = 'none' } = params;

  const stylesheets = new Set<string>();
  const scripts = new Map</** file name */ string, /** isModule */ boolean>();

  // Sort files in the order we want to insert them by entrypoint
  for (const [file, isModule] of entrypoints) {
    const extension = extname(file);
      if (scripts.has(file) || stylesheets.has(file)) {
        continue;
      }

      switch (extension) {
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
          // Also, non entrypoints need to be loaded as no module as they can contain problematic code.
          scripts.set(file, isModule);
          break;
        case '.mjs':
        case '.mts':
          if (!isModule) {
            // It would be very confusing to link an `*.mjs` file in a non-module script context,
            // so we disallow it entirely.
            throw new Error('`.mjs` & `.mts` files *must* set `isModule` to `true`.');
          }
          scripts.set(file, true /* isModule */);
          break;
        case '.css':
        case '.scss':
        case '.sass':
        case '.less':
          stylesheets.add(file);
          break;
      }
  }

  let scriptTags: string[] = [];
  for (const [src, isModule] of scripts) {
    const attrs = [`src="${deployUrl}${src}"`];

    // This is also need for non-entry-points as they may contain problematic code.
    if (isModule) {
      attrs.push('type="module"');
    } else {
      attrs.push('defer');
    }

    if (crossOrigin !== 'none') {
      attrs.push(`crossorigin="${crossOrigin}"`);
    }

    scriptTags.push(`<script ${attrs.join(' ')}></script>`);
  }

  let linkTags: string[] = [];
  for (const src of stylesheets) {
    const attrs = [`rel="stylesheet"`, `href="${deployUrl}${src}"`];

    if (crossOrigin !== 'none') {
      attrs.push(`crossorigin="${crossOrigin}"`);
    }

    linkTags.push(`<link ${attrs.join(' ')}>`);
  }

  if (params.hints?.length) {
    for (const hint of params.hints) {
      const attrs = [`rel="${hint.mode}"`, `href="${deployUrl}${hint.url}"`];

      if (hint.mode !== 'modulepreload' && crossOrigin !== 'none') {
        // Value is considered anonymous by the browser when not present or empty
        attrs.push(crossOrigin === 'anonymous' ? 'crossorigin' : `crossorigin="${crossOrigin}"`);
      }

      if (hint.mode === 'preload' || hint.mode === 'prefetch') {
        switch (extname(hint.url)) {
          case '.js':
            attrs.push('as="script"');
            break;
          case '.css':
            attrs.push('as="style"');
            break;
          default:
            if (hint.as) {
              attrs.push(`as="${hint.as}"`);
            }
            break;
        }
      }

      linkTags.push(`<link ${attrs.join(' ')}>`);
    }
  }

  const dir = lang ? await getLanguageDirection(lang, warnings) : undefined;
  const { rewriter, transformedContent } = await htmlRewritingStream(html);
  const baseTagExists = html.includes('<base');

  rewriter
    .on('startTag', (tag) => {
      switch (tag.tagName) {
        case 'html':
          // Adjust document locale if specified
          if (isString(lang)) {
            updateAttribute(tag, 'lang', lang);
          }

          if (dir) {
            updateAttribute(tag, 'dir', dir);
          }
          break;
        case 'head':
          // Base href should be added before any link, meta tags
          if (!baseTagExists && isString(baseHref)) {
            rewriter.emitStartTag(tag);
            rewriter.emitRaw(`<base href="${baseHref}">`);

            return;
          }
          break;
        case 'base':
          // Adjust base href if specified
          if (isString(baseHref)) {
            updateAttribute(tag, 'href', baseHref);
          }
          break;
      }

      rewriter.emitStartTag(tag);
    })
    .on('endTag', (tag) => {
      switch (tag.tagName) {
        case 'head':
          for (const linkTag of linkTags) {
            rewriter.emitRaw(linkTag);
          }

          linkTags = [];
          break;
        case 'body':
          // Add script tags
          for (const scriptTag of scriptTags) {
            rewriter.emitRaw(scriptTag);
          }

          scriptTags = [];
          break;
      }

      rewriter.emitEndTag(tag);
    });

  const content = await transformedContent();

  return {
    content:
      linkTags.length || scriptTags.length
        ? // In case no body/head tags are not present (dotnet partial templates)
          linkTags.join('') + scriptTags.join('') + content
        : content,
    warnings,
    errors,
  };
}

function updateAttribute(
  tag: { attrs: { name: string; value: string }[] },
  name: string,
  value: string,
): void {
  const index = tag.attrs.findIndex((a) => a.name === name);
  const newValue = { name, value };

  if (index === -1) {
    tag.attrs.push(newValue);
  } else {
    tag.attrs[index] = newValue;
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

async function getLanguageDirection(
  locale: string,
  warnings: string[],
): Promise<string | undefined> {
  const dir = await getLanguageDirectionFromLocales(locale);

  if (!dir) {
    warnings.push(
      `Locale data for '${locale}' cannot be found. 'dir' attribute will not be set for this locale.`,
    );
  }

  return dir;
}

async function getLanguageDirectionFromLocales(locale: string): Promise<string | undefined> {
  try {
    const localeData = (
      await loadEsmModule<typeof import('@angular/common/locales/en')>(
        `@angular/common/locales/${locale}`,
      )
    ).default;

    const dir = localeData[localeData.length - 2];

    return isString(dir) ? dir : undefined;
  } catch {
    // In some cases certain locales might map to files which are named only with language id.
    // Example: `en-US` -> `en`.
    const [languageId] = locale.split('-', 1);
    if (languageId !== locale) {
      return getLanguageDirectionFromLocales(languageId);
    }
  }

  return undefined;
}

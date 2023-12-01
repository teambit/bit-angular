import type { ServerResponse } from 'http';
import memoize from 'memoizee';
// @ts-ignore
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { ApplicationOptions } from '@bitdev/angular.dev-services.common';
import { IndexHtmlGenerator } from './index-file/index-html-generator';
import { generateEntryPoints } from './index-file/package-chunk-sort';
import assert from 'assert';

export function getIndexInputFile(index: ApplicationOptions['index']): string {
  assert(index, 'No index file provided');
  if (typeof index === 'string') {
    return index;
  }
  return (index as any).input;
}

const cleanUrl = (url: string) => url.replace(/#.*$/s, '').replace(/\?.*$/s, '');

async function genHtml(options: Partial<ApplicationOptions>, rootPath: string, indexPath: string) {
  assert(options.browser, 'No main file provided');
  const entrypoints = generateEntryPoints({
    main: options.browser,
    polyfills: options.polyfills ?? [],
    scripts: options.scripts ?? [],
    styles: options.styles ?? []
  });

  const indexHtmlGenerator = new IndexHtmlGenerator({
    rootPath,
    indexPath,
    entrypoints,
    crossOrigin: options.crossOrigin
  });

  const { content, warnings, errors } = await indexHtmlGenerator.process({
    baseHref: options.baseHref ?? './',
    // i18nLocale is used when Ivy is disabled
    lang: undefined
  });

  if (warnings.length) {
    // eslint-disable-next-line no-console
    warnings.forEach((warning) => console.warn(warning));
  }

  if (errors.length) {
    throw new Error(`Index html generation failed: ${errors.join(', ')}`);
  }

  return content;
};

const memoized = memoize(genHtml);

export const htmlPlugin = (options: Partial<ApplicationOptions>, rootPath: string, indexPath: string, ssr: boolean): Plugin => {
  return {
    name: 'ng-vite-html-plugin',
    configureServer(server: ViteDevServer) {
      return (): void => {
        // if(ssr) {
        //   return;
        // }
        server.middlewares.use(async(req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const url = req.url && cleanUrl(req.url);
          if (url?.endsWith('.html')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            let html = await memoized(options, rootPath, indexPath);
            html = await server.transformIndexHtml(indexPath, html, req.originalUrl);
            res.end(html);
            return;
          }
          next();
        });
      };
    }
  };
};

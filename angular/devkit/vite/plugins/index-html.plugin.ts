import type { BrowserBuilderOptions } from '@angular-devkit/build-angular';
import type { ServerResponse } from 'http';
import memoize from 'memoizee';
import { join } from 'path';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { IndexHtmlGenerator } from './index-file/index-html-generator';
import { generateEntryPoints } from './index-file/package-chunk-sort';

export function getIndexInputFile(index: BrowserBuilderOptions['index']): string {
  if (typeof index === 'string') {
    return index;
  }
  return index.input;
}

const cleanUrl = (url: string) => url.replace(/#.*$/s, '').replace(/\?.*$/s, '');

async function genHtml(options: Partial<BrowserBuilderOptions>, rootPath: string, sourceRoot = 'src') {
  const entrypoints = generateEntryPoints({
    main: options.main ?? `./${join(sourceRoot, `main.ts`)}`,
    polyfills: options.polyfills ?? `./${join(sourceRoot, `polyfills.ts`)}`,
    scripts: options.scripts ?? [],
    styles: options.styles ?? []
  });

  const indexHtmlGenerator = new IndexHtmlGenerator({
    rootPath,
    indexPath: getIndexInputFile(options.index ?? `./${join(sourceRoot, `index.html`)}`),
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

export const htmlPlugin = (options: Partial<BrowserBuilderOptions>, rootPath: string, sourceRoot = 'src'): Plugin => {
  return {
    name: 'html-plugin',
    configureServer(server: ViteDevServer) {
      return (): void => {
        server.middlewares.use(async(req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const url = req.url && cleanUrl(req.url);
          if (url?.endsWith('.html')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            let html = await memoized(options, rootPath, sourceRoot);
            html = await server.transformIndexHtml(options.index as string ?? `./${join(sourceRoot, `index.html`)}`, html, req.originalUrl);
            res.end(html);
            return;
          }
          next();
        });
      };
    }
  };
};

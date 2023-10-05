import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';

const cleanUrl = (url: string) => url.replace(/#.*$/s, '').replace(/\?.*$/s, '');

const defaultHeadHtml = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
// Allow to use react dev-tools inside the examples
try { window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.parent.__REACT_DEVTOOLS_GLOBAL_HOOK__; } catch {}
</script>
<style> body { margin: 0; } </style>
`

const defaultBodyHtml = `
<div id="root"></div>
`

const defaultGenScriptHtml = (entries: string[]): string => entries.map(
  src => `<script type="module" src="${src}"></script>`).join('\n');

const defaultGenHtml = (entries: string[]) => `
<!DOCTYPE html>
<html lang="en">
<head>${defaultHeadHtml}</head>
<body>
${defaultBodyHtml}
${defaultGenScriptHtml(entries)}
</body>
</html>`;

export type HtmlPluginOptions = {
  entries: string[];
  genHtml?: (entries: string[], context: { req: IncomingMessage, res: ServerResponse }) => string;
};

export const htmlPlugin = ({ entries, genHtml }: HtmlPluginOptions): Plugin => {
  return {
    name: 'html-plugin',
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url && cleanUrl(req.url)
          if (url?.endsWith('.html')) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            const preHtml = genHtml? genHtml(entries, { req, res }) : defaultGenHtml(entries);
            const html = await server.transformIndexHtml(
              url,
              preHtml,
              req.originalUrl
            )
            res.end(html)
            return
          }
          next()
        })
      }
    }
  }
}

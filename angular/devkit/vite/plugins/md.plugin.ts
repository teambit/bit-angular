import markdoc from '@markdoc/markdoc';
import { Plugin, PluginBuild } from 'esbuild';
import { promises } from 'fs';

/**
 * This plugin uses build.onLoad to intercept .md filenames.
 * These files are then read from disk and parsed by remark.
 * @returns An esbuild plugin.
 */
export default function () {
  const plugin: Plugin = {
    name: 'md-loader',

    setup(build: PluginBuild) {
      // intercept .md files
      build.onResolve({ filter: /\.md$/ }, args => {
        return {
          path: args.path,
          namespace: 'md-ns',
        }
      });

      build.onLoad({ filter: /.*/, namespace: 'md-ns' }, async args => {
        const data = await promises.readFile(args.path, 'utf8');
        const ast = markdoc.parse(data);
        const content = markdoc.transform(ast, {});
        const html = markdoc.renderers.html(content);
        return {
          contents: html,
          loader: 'text',
        };
      })
    }
  };

  return plugin;
}

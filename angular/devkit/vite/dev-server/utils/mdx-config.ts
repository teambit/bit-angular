import detectiveEs6 from '@teambit/node.deps-detectors.detective-es6';
// @ts-ignore
import remarkNotes from 'remark-admonitions';
import detectFrontmatter from 'remark-frontmatter';
import type { Pluggable } from 'unified';
import remove from 'unist-util-remove';
import visit from 'unist-util-visit';
import type { MdxOptions } from 'vite-plugin-mdx';
import yaml from 'yaml';

type ImportSpecifier = {
  /**
   * relative/absolute or module name. e.g. the `y` in the example of `import x from 'y';`
   */
  fromModule: string;

  /**
   * is default import (e.g. `import x from 'y';`)
   */
  isDefault?: boolean;

  /**
   * the name used to identify the module, e.g. the `x` in the example of `import x from 'y';`
   */
  identifier?: string;
};

const DEFAULT_RENDERER = `
// @ts-nocheck
import React from 'react'
import { mdx } from '@mdx-js/react'

/* @jsxRuntime classic */
/* @jsx mdx */
`;

function wrapWithScopeContext(): Pluggable {
  return (tree, file) => {
    const imports: ImportSpecifier[] = file.data?.imports || [];
    const ids = imports.reduce<string[]>((identifiers: string[], importSpecifier: ImportSpecifier) => {
      const newIds: string[] = [];
      if (importSpecifier.identifier) newIds.push(importSpecifier.identifier);
      return identifiers.concat(newIds);
    }, []);

    const preNode = {
      type: 'jsx',
      value: `<MDXScopeProvider components={{${ids.join(', ')}}}>`,
    };

    const postNode = {
      type: 'jsx',
      value: `</MDXScopeProvider>`,
    };

    tree.children.unshift({
      type: 'import',
      value: `import { MDXScopeProvider } from '@teambit/mdx.ui.mdx-scope-context';`,
    });

    tree.children.unshift(preNode);
    tree.children.push(postNode);
  };
}

function extractMetadata(): Pluggable {
  return function transformer(tree, file) {
    visit(tree, 'yaml', (node: any) => {
      try {
        // eslint-disable-next-line no-param-reassign
        file.data.frontmatter = yaml.parse(node.value, { prettyErrors: true });
      } catch (err: any) {
        throw new Error(
          `failed extracting metadata/front-matter using Yaml lib, due to an error (please disregard the line/column): ${err.message}`
        );
      }
    });
  };
}

function extractImports(): Pluggable {
  return function transformer(tree, file) {
    visit(tree, 'import', (node: any) => {
      const es6Import = detectiveEs6(node.value);
      const imports: ImportSpecifier[] = Object.keys(es6Import).flatMap((dep) => {
        if (!es6Import[dep].importSpecifiers) {
          return {
            fromModule: dep,
          };
        }
        return es6Import[dep].importSpecifiers.map((importSpecifier) => ({
          fromModule: dep,
          identifier: importSpecifier.name,
          isDefault: importSpecifier.isDefault,
        }));
      });
      // eslint-disable-next-line no-param-reassign
      (file.data.imports ||= []).push(...imports);
    });

    remove(tree, 'yaml');
  };
}

export const mdxOptions: MdxOptions = {
  remarkPlugins: [remarkNotes, [detectFrontmatter, ['yaml']], extractMetadata, extractImports],
  rehypePlugins: [wrapWithScopeContext],
  renderer: DEFAULT_RENDERER,
}

export const hostDependenciesFile = () => {
  return {
    relativePath: './preview/host-dependencies.ts',
    content: `/**
 * Dependencies to be bundled only once, in the env preview template, and not in each component preview.
 * most of your peer dependencies should be listed here to avoid duplications in the preview.
 * React, ReactDOM, and MDX are included as they are part of the preview ui.
 */
export default [
  '@teambit/mdx.ui.mdx-scope-context',
  '@mdx-js/react',
  'react',
  'react-dom',
];`,
  };
};

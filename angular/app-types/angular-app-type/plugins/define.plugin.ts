import { Plugin, PluginBuild } from 'esbuild';

export const stringifyDefine = (define: any) => {
  return Object.entries(define).reduce((acc: any, [key, value]) => {
    acc[key] = JSON.stringify(value);
    return acc;
  }, {});
};

/**
 * Pass environment variables to esbuild.
 * @returns An esbuild plugin.
 */
export default function(defineValues = {}) {
  // set variables on global so that they also work during ssr
  const keys = Object.keys(defineValues);
  keys.forEach((key: any) => {
    // @ts-ignore
    if (global[key]) {
      throw new Error(`Define plugin: key ${ key } already exists on global`);
    } else {
      // @ts-ignore
      global[key] = defineValues[key];
    }
  });

  const plugin: Plugin = {
    name: 'env',

    setup(build: PluginBuild) {
      const { platform, define = {} } = build.initialOptions;
      if (platform === 'node') {
        return;
      }

      if (typeof defineValues !== 'string') {
        defineValues = stringifyDefine(defineValues);
      }

      build.initialOptions.define = {
        ...defineValues,
        ...define
      };
    }
  };

  return plugin;
}

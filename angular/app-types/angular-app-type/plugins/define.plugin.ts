import { Plugin, PluginBuild } from 'esbuild';
import { merge } from 'lodash';

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
export default function(defineValues: any = {}) {
  // set variables on global so that they also work during ssr
  merge(global, defineValues);

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

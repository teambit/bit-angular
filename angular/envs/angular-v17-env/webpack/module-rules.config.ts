import { generateStyleLoaders } from '@teambit/webpack.modules.generate-style-loaders';
import * as stylesRegexps from '@teambit/webpack.modules.style-regexps';
import { merge } from 'lodash-es';
import { createRequire } from 'node:module';
// @ts-ignore
import getLocalIdent from 'react-dev-utils-esm/getCSSModuleLocalIdent.js';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';
import { RuleSetRule } from 'webpack';

const require = createRequire(import.meta.url);

const postCssConfig = {
  // Necessary for external CSS imports to work
  // https://github.com/facebook/create-react-app/issues/2677
  ident: 'postcss',
  plugins: [
    require.resolve('postcss-flexbugs-fixes'),
    require('postcss-preset-env')({
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
    }),
    // Adds PostCSS Normalize as the reset css with default options,
    // so that it honors browserslist config in package.json
    // which in turn lets users customize the target behavior as per their needs.
    // req.resolve('postcss-normalize'),
  ],
};

const styleLoaderPath = require.resolve('style-loader');

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

export function getModuleRulesConfig(isEnvProduction: boolean): RuleSetRule[] {
  const baseStyleLoadersOptions = {
    injectingLoader: styleLoaderPath,
    cssLoaderPath: require.resolve('css-loader'),
    postCssLoaderPath: require.resolve('postcss-loader'),
    postCssConfig
  };

  return [
    {
      test: /\.m?js/,
      resolve: {
        fullySpecified: false
      }
    },
    {
      // "oneOf" will traverse all following loaders until one will
      // match the requirements. When no loader matches it will fall
      // back to the "file" loader at the end of the loader list.
      oneOf: [
        // MDX support
        {
          test: /\.md$/,
          use: [
            {
              loader: 'html-loader'
            },
            {
              loader: 'remark-loader',
              options: {
                removeFrontMatter: false,
                remarkOptions: {
                  plugins: [RemarkPrism, RemarkHTML, RemarkFrontmatter]
                }
              }
            }
          ]
        },
        // "postcss" loader applies autoprefixer to our CSS.
        // "css" loader resolves paths in CSS and adds assets as dependencies.
        // "style" loader turns CSS into JS modules that inject <style> tags.
        // In production, we use MiniCSSExtractPlugin to extract that CSS
        // to a file, but in development "style" loader enables hot editing
        // of CSS.
        // By default we support CSS Modules with the extension .module.css
        {
          test: stylesRegexps.cssNoModulesRegex,
          use: generateStyleLoaders(
            merge({}, baseStyleLoadersOptions, {
              cssLoaderOpts: {
                importLoaders: 1,
                sourceMap: isEnvProduction || shouldUseSourceMap,
              },
            })
          ),
          // Don't consider CSS imports dead code even if the
          // containing package claims to have no side effects.
          // Remove this when webpack adds a warning or an error for this.
          // See https://github.com/webpack/webpack/issues/6571
          sideEffects: true,
        },
        // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
        // using the extension .module.css
        {
          test: stylesRegexps.cssModuleRegex,
          use: generateStyleLoaders(
            merge({}, baseStyleLoadersOptions, {
              cssLoaderOpts: {
                importLoaders: 1,
                sourceMap: isEnvProduction || shouldUseSourceMap,
                modules: {
                  getLocalIdent
                }
              },
              shouldUseSourceMap: isEnvProduction || shouldUseSourceMap
            })
          )
        },
        // Adds support for CSS Modules, but using SASS
        // using the extension .module.scss or .module.sass
        {
          test: stylesRegexps.sassModuleRegex,
          use: generateStyleLoaders(
            merge({}, baseStyleLoadersOptions, {
              cssLoaderOpts: {
                importLoaders: 3,
                sourceMap: isEnvProduction || shouldUseSourceMap,
                modules: {
                  getLocalIdent
                }
              },
              shouldUseSourceMap: isEnvProduction || shouldUseSourceMap,
              preProcessOptions: {
                resolveUrlLoaderPath: require.resolve('resolve-url-loader'),
                preProcessorPath: require.resolve('sass-loader')
              }
            })
          )
        }
      ]
    }
  ];
}

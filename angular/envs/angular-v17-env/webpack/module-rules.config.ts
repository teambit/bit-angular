import { generateStyleLoaders } from '@teambit/webpack.modules.generate-style-loaders';
import * as stylesRegexps from '@teambit/webpack.modules.style-regexps';
import { merge } from 'lodash';
import getCSSModuleLocalIdent from 'react-dev-utils/getCSSModuleLocalIdent';
import RemarkFrontmatter from 'remark-frontmatter';
import RemarkHTML from 'remark-html';
import RemarkPrism from 'remark-prism';
import { RuleSetRule } from 'webpack';

const postCssConfig = {
  // Necessary for external CSS imports to work
  // https://github.com/facebook/create-react-app/issues/2677
  ident: 'postcss',
  plugins: [
    // eslint-disable-next-line global-require
    require.resolve('postcss-flexbugs-fixes'),
    // eslint-disable-next-line global-require
    require('postcss-preset-env')({
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
    }),
    // Adds PostCSS Normalize as the reset css with default options,
    // so that it honors browserslist config in package.json
    // which in turn lets users customize the target behavior as per their needs.
    // require.resolve('postcss-normalize'),
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
                  getLocalIdent: getCSSModuleLocalIdent
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
                  getLocalIdent: getCSSModuleLocalIdent
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

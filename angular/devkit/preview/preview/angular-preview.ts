import {
  AngularEnvOptions,
  ApplicationOptions,
  BrowserOptions,
  DevServerOptions
} from '@bitdev/angular.dev-services.common';
import { AppContext } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { AsyncEnvHandler, EnvHandler } from '@teambit/envs';
import { EnvPreviewConfig, Preview } from '@teambit/preview';
import { WebpackConfigTransformer, WebpackConfigWithDevServer } from '@teambit/webpack';
import objectHash from 'object-hash';
import { join, resolve } from 'path';
import type { Configuration } from 'webpack';
// Make sure bit recognizes the dependencies
import 'webpack-dev-server';
import { NgWebpackBundler, NgWebpackDevServer } from '@bitdev/angular.dev-services.webpack';

export type DevServerProvider = (
  context: DevServerContext | (DevServerContext & AppContext),
  transformers?: WebpackConfigTransformer[],
  angularOptions?: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions>,
  webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
  sourceRoot?: string
) => AsyncEnvHandler<DevServer>;

export type BundlerProvider = (
  context: BundlerContext | (BundlerContext & AppContext),
  transformers?: WebpackConfigTransformer[],
  angularOptions?: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions>,
  webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
  sourceRoot?: string
) => AsyncEnvHandler<Bundler>;

interface AngularPreviewOptions {
  /**
   * Override the default Angular docs template path
   */
  docsTemplatePath?: string;

  /**
   * Deps that will be bundled with the env template and will be configured as externals for the component bundle.
   * These dependencies will be available in the preview as singletons.
   */
  hostDependencies?: string[];

  /**
   * Override the default Angular mount path
   */
  mounterPath?: string;

  /**
   * Name of the angular preview.
   */
  name?: string;

  /**
   * Angular env options
   */
  ngEnvOptions: AngularEnvOptions;

  /**
   * Configuration for the preview.
   */
  previewConfig?: EnvPreviewConfig;

  /**
   * Angular options for `bit run`
   */
  angularServeOptions?: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions>;

  /**
   * Set webpack serve transformers
   */
  webpackServeTransformers?: WebpackConfigTransformer[];

  /**
   * Angular options for `bit build`
   */
  angularBuildOptions?: Partial<(BrowserOptions | ApplicationOptions)>;

  /**
   * Set webpack build transformers
   */
  webpackBuildTransformers?: WebpackConfigTransformer[];

  /**
   * The root of the source files, assets and index.html file structure.
   */
  sourceRoot?: string;
}

export function getPreviewRootPath(): string {
  // __dirname is the path of the current file in dist, we want the preview app source code
  return resolve(join(__dirname, '../preview-app/'));
}


export class AngularPreview implements Preview {
  private constructor(
    readonly name: string,
    private ngEnvOptions: AngularEnvOptions,
    private angularServeOptions: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions> = {},
    private webpackServeTransformers: WebpackConfigTransformer[] = [],
    private angularBuildOptions: Partial<(BrowserOptions | ApplicationOptions)> = {},
    private webpackBuildTransformers: WebpackConfigTransformer[] = [],
    private docsTemplatePath: string = require.resolve('./docs'),
    private mounterPath: string = require.resolve('./mounter'),
    private previewConfig: EnvPreviewConfig = {},
    private hostDependencies?: string[],
    private sourceRoot?: string,
  ) {}

  getDevServer(context: DevServerContext): AsyncEnvHandler<DevServer> {
    return NgWebpackDevServer.from({
      angularOptions: this.angularServeOptions,
      devServerContext: context,
      ngEnvOptions: this.ngEnvOptions,
      transformers: this.webpackServeTransformers,
      sourceRoot: this.sourceRoot,
    });
  }

  getDevEnvId() {
    const objToHash = {
      webpack: this.ngEnvOptions.webpackModulePath,
      webpackDevServer: this.ngEnvOptions.webpackDevServerModulePath,
    };
    return objectHash(objToHash);
  }

  getBundler(context: BundlerContext): AsyncEnvHandler<Bundler> {
    return NgWebpackBundler.from({
      angularOptions: this.angularBuildOptions,
      bundlerContext: context,
      ngEnvOptions: this.ngEnvOptions,
      transformers: this.webpackBuildTransformers,
      sourceRoot: this.sourceRoot,
    });
  }

  /**
   * Dependencies to be bundled only once, in the env preview template, and not in each component preview.
   * most of your peer dependencies should be listed here to avoid duplications in the preview.
   * React, ReactDOM, and MDX are included as they are part of the preview ui.
   */
  getHostDependencies(): string[] {
    return (
      this.hostDependencies || [
        '@teambit/mdx.ui.mdx-scope-context',
        '@mdx-js/react',
        'react',
        'react-dom',
      ]
    );
  }

  getMounter(): string {
    return this.mounterPath;
  }

  getDocsTemplate(): string {
    return this.docsTemplatePath;
  }

  getPreviewConfig(): EnvPreviewConfig & {isScaling ?: boolean} {
    return {
      strategyName: 'env',
      // splitComponentBundle: true,
      // isScaling: true,
      ...this.previewConfig,
    };
  }

  static from(options: AngularPreviewOptions): EnvHandler<Preview> {
    const name = options.name || 'angular-preview';
    return () => {
      return new AngularPreview(
        name,
        options.ngEnvOptions,
        options.angularServeOptions,
        options.webpackServeTransformers,
        options.angularBuildOptions,
        options.webpackBuildTransformers,
        options.docsTemplatePath,
        options.mounterPath,
        options.previewConfig,
        options.hostDependencies,
        options.sourceRoot,
      );
    };
  }
}

import { AngularEnvOptions, BrowserOptions, DevServerOptions } from '@bitdev/angular.dev-services.common';
import { AppContext } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { AsyncEnvHandler, EnvHandler } from '@teambit/envs';
import { EnvPreviewConfig, Preview } from '@teambit/preview';
import { WebpackConfigTransformer, WebpackConfigWithDevServer } from '@teambit/webpack';
import objectHash from 'object-hash';
import { Configuration } from 'webpack';
// Make sure bit recognizes the dependencies
import 'webpack-dev-server';

export type DevServerProvider = (
  context: DevServerContext | (DevServerContext & AppContext),
  transformers?: WebpackConfigTransformer[],
  angularOptions?: Partial<BrowserOptions & DevServerOptions>,
  webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
  sourceRoot?: string
) => AsyncEnvHandler<DevServer>;

export type BundlerProvider = (
  context: BundlerContext | (BundlerContext & AppContext),
  transformers?: WebpackConfigTransformer[],
  angularOptions?: Partial<BrowserOptions & DevServerOptions>,
  webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
  sourceRoot?: string
) => AsyncEnvHandler<Bundler>;

interface AngularPreviewOptions {
  /**
   * Name of the angular preview.
   */
  name?: string;

  /**
   * Configuration for the preview.
   */
  previewConfig?: EnvPreviewConfig;

  /**
   * Deps that will be bundled with the env template and will be configured as externals for the component bundle.
   * These dependencies will be available in the preview as singletons.
   */
  hostDependencies?: string[];

  // /**
  //  * DOM mounter used for the thumbnail.
  //  */
  // thumbnail?: string;

  /**
   * Bundler to be used for the preview.
   */
  bundlerProvider: BundlerProvider;

  /**
   * Dev server to use for preview.
   */
  devServerProvider: DevServerProvider;

  /**
   * Angular env options
   */
  ngEnvOptions: AngularEnvOptions;

  /**
   * Override the default Angular docs template path
   */
  docsTemplatePath?: string;

  /**
   * Override the default Angular mount path
   */
  mounterPath?: string;
}

export class AngularPreview implements Preview {
  private constructor(
    readonly name: string,
    private ngEnvOptions: AngularEnvOptions,
    private devServerProvider: DevServerProvider,
    private bundlerProvider: BundlerProvider,
    private docsTemplatePath: string = require.resolve('./docs'),
    private mounterPath: string = require.resolve('./mounter'),
    private previewConfig: EnvPreviewConfig = {},
    private hostDependencies?: string[],
  ) {}

  getDevServer(
    context: DevServerContext,
    transformers?: WebpackConfigTransformer[],
    angularOptions?: Partial<BrowserOptions & DevServerOptions>,
    webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
    sourceRoot?: string
  ): AsyncEnvHandler<DevServer> {
    return this.devServerProvider(context, transformers, angularOptions, webpackOptions, sourceRoot);
  }

  getDevEnvId() {
    const objToHash = {
      webpack: this.ngEnvOptions.webpackModulePath,
      webpackDevServer: this.ngEnvOptions.webpackDevServerModulePath,
    };
    return objectHash(objToHash);
  }

  getBundler(
    context: BundlerContext
  ): AsyncEnvHandler<Bundler> {
    return this.bundlerProvider(context);
  }

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
        options.devServerProvider,
        options.bundlerProvider,
        options.docsTemplatePath,
        options.mounterPath,
        options.previewConfig,
        options.hostDependencies,
      );
    };
  }
}

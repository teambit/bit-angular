import {
  AngularEnvOptions,
  ApplicationOptions,
  BrowserOptions,
  DevServerOptions,
  getWorkspace,
  isAppBuildContext,
  isAppDevContext
} from '@bitdev/angular.dev-services.common';
import { NgWebpackBundler, NgWebpackDevServer } from '@bitdev/angular.dev-services.webpack';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { AsyncEnvHandler, EnvContext, EnvHandler } from '@teambit/envs';
import { EnvPreviewConfig, Preview } from '@teambit/preview';
import { WebpackConfigTransformer } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import objectHash from 'object-hash';
// Make sure bit recognizes the dependencies
import 'webpack-dev-server';

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
  const appPath = dirname(fileURLToPath(import.meta.resolve('@bitdev/angular.dev-services.preview.preview-app')));
  // appPath is the path of the current file in dist
  // but we want the preview app source code files (.ts) which are located in the parent directory
  return resolve(join(appPath, '../preview-app/'));
}


export class AngularPreview implements Preview {
  private constructor(
    readonly name: string,
    private ngEnvOptions: AngularEnvOptions,
    private angularServeOptions: Partial<(BrowserOptions | ApplicationOptions) & DevServerOptions> = {},
    private webpackServeTransformers: WebpackConfigTransformer[] = [],
    private angularBuildOptions: Partial<(BrowserOptions | ApplicationOptions)> = {},
    private webpackBuildTransformers: WebpackConfigTransformer[] = [],
    private docsTemplatePath: string = fileURLToPath(import.meta.resolve('./docs.js')),
    private mounterPath: string = fileURLToPath(import.meta.resolve('./mounter.js')),
    private previewConfig: EnvPreviewConfig = {},
    private hostDependencies?: string[],
    private sourceRoot?: string,
    private workspace?: Workspace
  ) {
  }

  getDevServer(context: DevServerContext): AsyncEnvHandler<DevServer> {
    let appRootPath: string;
    if (isAppDevContext(context)) { // When you use `bit run <app>`
      appRootPath = this.workspace?.componentDir(context.appComponent.id, {
        ignoreVersion: true
      }) || '';
    } else { // When you use `bit start`
      appRootPath = getPreviewRootPath();
    }
    return NgWebpackDevServer.from({
      angularOptions: this.angularServeOptions,
      devServerContext: context,
      ngEnvOptions: this.ngEnvOptions,
      transformers: this.webpackServeTransformers,
      sourceRoot: this.sourceRoot,
      appRootPath
    });
  }

  getDevEnvId() {
    const objToHash = {
      webpack: this.ngEnvOptions.webpackModulePath,
      webpackDevServer: this.ngEnvOptions.webpackDevServerModulePath,
      transformers: this.webpackServeTransformers
    };
    return objectHash(objToHash);
  }

  getBundler(context: BundlerContext): AsyncEnvHandler<Bundler> {
    let appRootPath: string;
    if (isAppBuildContext(context)) { // When you use `bit build` for an actual angular app
      appRootPath = context.capsule.path;
    } else { // When you use `bit build` for the preview app
      appRootPath = getPreviewRootPath();
    }
    return NgWebpackBundler.from({
      // @ts-ignore
      angularOptions: this.angularBuildOptions,
      bundlerContext: context,
      ngEnvOptions: this.ngEnvOptions,
      transformers: this.webpackBuildTransformers,
      sourceRoot: this.sourceRoot,
      appRootPath
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
        'react-dom'
      ]
    );
  }

  getMounter(): string {
    return this.mounterPath;
  }

  getDocsTemplate(): string {
    return this.docsTemplatePath;
  }

  getPreviewConfig(): EnvPreviewConfig & { isScaling?: boolean } {
    return {
      strategyName: 'env',
      // splitComponentBundle: true,
      // isScaling: true,
      ...this.previewConfig
    };
  }

  static from(options: AngularPreviewOptions): EnvHandler<Preview> {
    const name = options.name || 'angular-preview';
    return (context: EnvContext) => {
      const workspace = getWorkspace(context);

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
        workspace
      );
    };
  }
}

import type { BrowserBuilderOptions, DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { AppsEnv } from '@teambit/application';
import { BuilderEnv } from '@teambit/builder';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { CompilerEnv } from '@teambit/compiler';
import { AsyncEnvHandler } from '@teambit/envs';
import { PreviewEnv } from '@teambit/preview';
import { Configuration, WebpackConfigTransformer, WebpackConfigWithDevServer } from '@teambit/webpack';
import { AngularEnvOptions } from './env-options';

export type BrowserOptions = Omit<BrowserBuilderOptions, "outputPath" | "preserveSymlinks">;
export type DevServerOptions = Omit<DevServerBuilderOptions, "aot" | "baseHref" | "browserTarget" | "commonChunk" | "deployUrl" | "hmrWarning" | "open" | "optimization" | "port" | "progress" | "servePathDefaultWarning" | "sourceMap" | "vendorChunk">;

export interface GenericAngularEnv
  extends AppsEnv,
    CompilerEnv,
    PreviewEnv,
    BuilderEnv {
  getNgEnvOptions(): AngularEnvOptions;

  getDevServer(
    devServerContext: DevServerContext,
    ngEnvOptions: AngularEnvOptions,
    transformers?: WebpackConfigTransformer[],
    angularOptions?: Partial<BrowserOptions & DevServerOptions>,
    webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
    sourceRoot?: string
  ): AsyncEnvHandler<DevServer>;

  getBundler(
    bundlerContext: BundlerContext,
    ngEnvOptions: AngularEnvOptions,
    transformers?: WebpackConfigTransformer[],
    angularOptions?: Partial<BrowserOptions & DevServerOptions>,
    webpackOptions?: Partial<WebpackConfigWithDevServer | Configuration>,
    sourceRoot?: string
  ): AsyncEnvHandler<Bundler>
}

// export interface GenericAngularEnv extends PreviewEnv{
//   getDevServer: (context: DevServerContext, transformers?: WebpackConfigTransformer[], angularServeOptions?: DevServerOptions, sourceRoot?: string) => DevServer | Promise<DevServer>;
//   getBundler(context: BundlerContext | (BundlerContext & AppBuildContext), transformers?: any[], angularBuildOptions?: BrowserOptions, sourceRoot?: string): Promise<Bundler>
//   getCompiler(): Compiler;
//   angularWebpack: any;
// }

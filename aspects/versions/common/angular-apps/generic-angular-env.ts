import { AppBuildContext } from '@teambit/application';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@teambit/bundler';
import { Compiler } from '@teambit/compiler';
import { WebpackConfigTransformer } from '@teambit/webpack';
import type { BrowserBuilderOptions, DevServerBuilderOptions } from '@angular-devkit/build-angular';

export type BrowserOptions = Omit<BrowserBuilderOptions, "outputPath" | "preserveSymlinks">;
export type DevServerOptions = Omit<DevServerBuilderOptions, "aot" | "baseHref" | "browserTarget" | "commonChunk" | "deployUrl" | "hmrWarning" | "open" | "optimization" | "port" | "progress" | "servePathDefaultWarning" | "sourceMap" | "vendorChunk">;

export interface GenericAngularEnv {
  getDevServer: (context: DevServerContext, transformers?: WebpackConfigTransformer[], angularServeOptions?: DevServerOptions, sourceRoot?: string) => DevServer | Promise<DevServer>;
  getBundler(context: BundlerContext | (BundlerContext & AppBuildContext), transformers?: any[], angularBuildOptions?: BrowserOptions, sourceRoot?: string): Promise<Bundler>
  getCompiler(): Compiler;
  angularWebpack: any;
}

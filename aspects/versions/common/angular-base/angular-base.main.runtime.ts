import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { BrowserOptions, DevServerOptions } from '@teambit/angular-apps';
import { BundlerContext, DevServerContext } from '@teambit/bundler';
import { Compiler, CompilerOptions } from '@teambit/compiler';
import { Environment, EnvsMain, EnvTransformer } from '@teambit/envs';
import { WebpackConfigTransformer, WebpackConfigWithDevServer } from '@teambit/webpack';
import { Configuration } from 'webpack';
import { AngularBaseEnv, AngularEnvOptions } from './angular-base.env';


export abstract class AngularBaseMain {
  constructor(protected envs: EnvsMain, protected angularEnv: AngularBaseEnv) {
    envs.registerEnv(angularEnv);
  }

  /**
   * Create a new composition of the angular environment.
   */
  compose(transformers: EnvTransformer[], targetEnv: Environment = {}) {
    return this.envs.compose(this.envs.merge(targetEnv, this.angularEnv), transformers);
  }

  /**
   * Override the compiler options for the Angular environment.
   * Compiler options combine both typescript "compilerOptions" and Angular specific "angularCompilerOptions"
   */
  overrideCompilerOptions(tsconfigPath: string, bitCompilerOptions?: Partial<CompilerOptions>): EnvTransformer;
  overrideCompilerOptions(compilerOptions: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): EnvTransformer;
  overrideCompilerOptions(opts?: AngularCompilerOptions | string, bitCompilerOptions?: Partial<CompilerOptions>): EnvTransformer {
    let tsCompilerOptions: AngularCompilerOptions | undefined;
    if (typeof opts === 'string') {
      // tsCompilerOptions = readConfiguration(opts).options;
      throw new Error('Angular compiler options should be an object, not a string');
    } else {
      tsCompilerOptions = opts;
    }

    return this.envs.override({
      getCompiler: () => {
        return this.angularEnv.getCompiler(tsCompilerOptions, bitCompilerOptions);
      },
      getBuildPipe: () => {
        return this.angularEnv.getBuildPipe(tsCompilerOptions, bitCompilerOptions);
      }
    });
  }

  /**
   * Override Angular options for serve (bit start) and build (bit build).
   * Angular options are the ones you could find in an angular.json file
   */
  overrideAngularOptions(angularOpts: Partial<BrowserOptions & DevServerOptions>): EnvTransformer;
  overrideAngularOptions(serveOpts: Partial<BrowserOptions & DevServerOptions>, buildOpts: Partial<BrowserOptions>): EnvTransformer;
  overrideAngularOptions(serveOpts: Partial<BrowserOptions & DevServerOptions>, buildOpts?: Partial<BrowserOptions>): EnvTransformer {
    if (typeof buildOpts === 'undefined') {
      buildOpts = serveOpts;
    }
    const angularWebpack = this.angularEnv.angularWebpack;
    angularWebpack.angularServeOptions = serveOpts;
    angularWebpack.angularBuildOptions = buildOpts;
    return this.envs.override({
      angularWebpack
    });
  }

  /**
   * Override Webpack options for serve (bit start) and build (bit build).
   */
  overrideWebpackOptions(webpackOpts: Partial<WebpackConfigWithDevServer>): EnvTransformer;
  overrideWebpackOptions(serveOpts: Partial<WebpackConfigWithDevServer>, buildOpts: Partial<Configuration>): EnvTransformer;
  overrideWebpackOptions(serveOpts: Partial<WebpackConfigWithDevServer>, buildOpts?: Partial<Configuration>): EnvTransformer {
    if (typeof buildOpts === 'undefined') {
      buildOpts = serveOpts as Partial<Configuration>;
    }
    const angularWebpack = this.angularEnv.angularWebpack;
    angularWebpack.webpackServeOptions = serveOpts;
    angularWebpack.webpackBuildOptions = buildOpts;
    return this.envs.override({
      angularWebpack
    });
  }

  /***
   * Override options for the Angular Env
   */
  overrideAngularEnvOptions(ngEnvOptions: AngularEnvOptions): EnvTransformer {
    return this.envs.override({
      getAdditionalHostDependencies: () => this.angularEnv.getAdditionalHostDependencies(ngEnvOptions),
      getBundler: (context: BundlerContext, transformers: any[], angularBuildOptions: Partial<BrowserOptions> = {}, sourceRoot?: string) => this.angularEnv.getBundler(context, transformers, angularBuildOptions, sourceRoot, ngEnvOptions),
      getCompiler: (tsCompilerOptions?: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): Compiler => this.angularEnv.getCompiler(tsCompilerOptions, bitCompilerOptions, ngEnvOptions),
      getDevEnvId: (context: DevServerContext) => this.angularEnv.getDevEnvId(context.envDefinition.id),
      getDevServer: (context: DevServerContext, transformers: WebpackConfigTransformer[] = [], angularServeOptions: Partial<BrowserOptions & DevServerOptions> = {}, sourceRoot?: string) => this.angularEnv.getDevServer(context, transformers, angularServeOptions, sourceRoot, ngEnvOptions),
      getDocsTemplate: () => this.angularEnv.getDocsTemplate(ngEnvOptions),
      getMounter: () => this.angularEnv.getMounter(ngEnvOptions),
      getPreviewConfig: () => this.angularEnv.getPreviewConfig(ngEnvOptions),
    });
  }
}

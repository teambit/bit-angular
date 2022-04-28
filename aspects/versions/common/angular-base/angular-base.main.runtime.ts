import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { BrowserOptions, DevServerOptions } from '@teambit/angular-apps';
import { ApplicationAspect } from '@teambit/application';
import AspectLoaderAspect from '@teambit/aspect-loader';
import { BabelAspect } from '@teambit/babel';
import { MainRuntime } from '@teambit/cli';
import { CompilerAspect, CompilerOptions } from '@teambit/compiler';
import { DependencyResolverAspect } from '@teambit/dependency-resolver';
import { Environment, EnvsAspect, EnvsMain, EnvTransformer } from '@teambit/envs';
import { ESLintAspect } from '@teambit/eslint';
import { GeneratorAspect } from '@teambit/generator';
import { IsolatorAspect } from '@teambit/isolator';
import { JestAspect } from '@teambit/jest';
import { MultiCompilerAspect } from '@teambit/multi-compiler';
import { NgPackagrAspect } from '@teambit/ng-packagr';
import { PkgAspect } from '@teambit/pkg';
import { ReactAspect } from '@teambit/react';
import { TesterAspect } from '@teambit/tester';
import { WebpackAspect, WebpackConfigWithDevServer } from '@teambit/webpack';
import { WorkspaceAspect } from '@teambit/workspace';
import { Configuration } from 'webpack';
import { AngularBaseEnv } from './angular-base.env';

export abstract class AngularBaseMain {
  static slots = [];
  static runtime: any = MainRuntime;
  static dependencies: any = [
    JestAspect,
    CompilerAspect,
    TesterAspect,
    ESLintAspect,
    NgPackagrAspect,
    GeneratorAspect,
    WebpackAspect,
    WorkspaceAspect,
    EnvsAspect,
    IsolatorAspect,
    PkgAspect,
    ApplicationAspect,
    AspectLoaderAspect,
    MultiCompilerAspect,
    BabelAspect,
    DependencyResolverAspect,
    ReactAspect,
  ];

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
}

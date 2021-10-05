import { CompilerOptions as TsCompilerOptions, readConfiguration } from '@angular/compiler-cli';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { CompilerAspect, CompilerMain, CompilerOptions } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Environment, EnvsAspect, EnvsMain, EnvTransformer } from '@teambit/envs';
import { ESLintAspect, ESLintMain } from '@teambit/eslint';
import { GeneratorAspect, GeneratorMain } from '@teambit/generator';
import { JestAspect, JestMain } from '@teambit/jest';
import { MainRuntime } from '@teambit/cli';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { PkgAspect } from '@teambit/pkg';
import { PkgMain } from '@teambit/pkg';
import { NgPackagrAspect, NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackAspect, WebpackConfigWithDevServer, WebpackMain } from '@teambit/webpack';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { Configuration } from 'webpack';
import { AngularEnv } from './angular.env';

export type AngularDeps = [
  JestMain,
  CompilerMain,
  ESLintMain,
  NgPackagrMain,
  GeneratorMain,
  WebpackMain,
  Workspace | undefined,
  CompositionsMain,
  EnvsMain,
  IsolatorMain,
  PkgMain
];

export abstract class AngularMain {
  static slots = [];
  static runtime: any = MainRuntime;
  static dependencies: any = [
    JestAspect,
    CompilerAspect,
    ESLintAspect,
    NgPackagrAspect,
    GeneratorAspect,
    WebpackAspect,
    WorkspaceAspect,
    CompositionsAspect,
    EnvsAspect,
    IsolatorAspect,
    PkgAspect,
  ];

  constructor(private envs: EnvsMain, private angularEnv: AngularEnv) {
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
  overrideCompilerOptions(compilerOptions: TsCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): EnvTransformer;
  overrideCompilerOptions(opts?: TsCompilerOptions | string, bitCompilerOptions?: Partial<CompilerOptions>): EnvTransformer {
    let tsCompilerOptions: TsCompilerOptions | undefined;
    if (typeof opts === 'string') {
      tsCompilerOptions = readConfiguration(opts).options;
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
  overrideAngularOptions(angularOpts: Partial<BrowserBuilderSchema>): EnvTransformer;
  overrideAngularOptions(serveOpts: Partial<BrowserBuilderSchema>, buildOpts: Partial<BrowserBuilderSchema>): EnvTransformer;
  overrideAngularOptions(serveOpts: Partial<BrowserBuilderSchema>, buildOpts?: Partial<BrowserBuilderSchema>): EnvTransformer {
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

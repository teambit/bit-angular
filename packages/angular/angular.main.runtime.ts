import { CompilerOptions as TsCompilerOptions, readConfiguration } from '@angular/compiler-cli';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { CompilerAspect, CompilerMain, CompilerOptions } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Environment, EnvsAspect, EnvsMain, EnvTransformer } from '@teambit/envs';
import { ESLintAspect, ESLintMain } from '@teambit/eslint';
import { GeneratorAspect, GeneratorMain } from '@teambit/generator';
import { JestAspect, JestMain } from '@teambit/jest';
import { MainRuntime } from '@teambit/cli';
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
  Workspace,
  CompositionsMain,
  EnvsMain
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
  overrideAngularOptions(serveOpts: Partial<BrowserBuilderSchema>, buildOpts: Partial<BrowserBuilderSchema>) {
    this.angularEnv.angularWebpack.angularServeOptions = serveOpts;
    this.angularEnv.angularWebpack.angularBuildOptions = buildOpts;
  }

  /**
   * Override Webpack options for serve (bit start) and build (bit build).
   */
  overrideWebpackOptions(serveOpts: Partial<WebpackConfigWithDevServer>, buildOpts: Partial<Configuration>) {
    this.angularEnv.angularWebpack.webpackServeOptions = serveOpts;
    this.angularEnv.angularWebpack.webpackBuildOptions = buildOpts;
  }
}

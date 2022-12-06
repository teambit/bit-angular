import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { AngularBaseMain, AngularEnvOptions, loadEsmModule } from '@teambit/angular-base';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { AspectLoaderMain, AspectLoaderAspect } from '@teambit/aspect-loader';
import { BabelAspect, BabelMain } from '@teambit/babel';
import { MainRuntime } from '@teambit/cli';
import { CompilerAspect, CompilerMain, CompilerOptions } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvsAspect, EnvsMain, EnvTransformer } from '@teambit/envs';
import { ESLintAspect, ESLintMain } from '@teambit/eslint';
import { GeneratorAspect, GeneratorMain } from '@teambit/generator';
import { IsolatorAspect, IsolatorMain } from '@teambit/isolator';
import { JestAspect, JestMain } from '@teambit/jest';
import { LoggerAspect, LoggerMain } from '@teambit/logger';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { ReactAspect, ReactMain } from '@teambit/react';
import { TesterAspect, TesterMain } from '@teambit/tester';
import { WebpackAspect, WebpackMain } from '@teambit/webpack';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { NativeCompileCache } from '@teambit/toolbox.performance.v8-cache';
import { AngularV13Aspect } from './angular-v13.aspect';
import { AngularV13Env } from './angular-v13.env';

// Disable v8-caching because it breaks ESM loaders
NativeCompileCache.uninstall();

export class AngularV13Main extends AngularBaseMain {
  static slots = [];
  static runtime: any = MainRuntime;
  static dependencies: any = [
    JestAspect,
    CompilerAspect,
    TesterAspect,
    ESLintAspect,
    GeneratorAspect,
    WebpackAspect,
    WorkspaceAspect,
    EnvsAspect,
    IsolatorAspect,
    PkgAspect,
    ApplicationAspect,
    AspectLoaderAspect,
    DependencyResolverAspect,
    ReactAspect,
    LoggerAspect,
    CompositionsAspect,
    BabelAspect,
  ];

  static async provider([
    jestAspect,
    compiler,
    tester,
    eslint,
    generator,
    webpack,
    workspace,
    envs,
    isolator,
    pkg,
    application,
    aspectLoader,
    dependencyResolver,
    react,
    loggerMain,
    compositions,
    babel,
  ]: [
    JestMain,
    CompilerMain,
    TesterMain,
    ESLintMain,
    GeneratorMain,
    WebpackMain,
    Workspace | undefined,
    EnvsMain,
    IsolatorMain,
    PkgMain,
    ApplicationMain,
    AspectLoaderMain,
    DependencyResolverMain,
    ReactMain,
    LoggerMain,
    CompositionsMain,
    BabelMain,
  ], options: AngularEnvOptions): Promise<AngularBaseMain> {
    const angularV13Env = new AngularV13Env(
      jestAspect,
      compiler,
      tester,
      eslint,
      generator,
      isolator,
      webpack,
      workspace,
      pkg,
      application,
      aspectLoader,
      dependencyResolver,
      react,
      loggerMain,
      compositions,
      babel,
      options,
    );
    // @ts-ignore
    return new AngularV13Main(envs, angularV13Env);
  }

  /**
   * Override the compiler options for the Angular environment.
   * Compiler options combine both typescript "compilerOptions" and Angular specific "angularCompilerOptions"
   */
  // @ts-ignore
  async overrideCompilerOptions(tsconfigPath: string, bitCompilerOptions?: Partial<CompilerOptions>): Promise<EnvTransformer>;
  // @ts-ignore
  async overrideCompilerOptions(compilerOptions: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): Promise<EnvTransformer>;
  // @ts-ignore
  async overrideCompilerOptions(opts?: AngularCompilerOptions | string, bitCompilerOptions?: Partial<CompilerOptions>): Promise<EnvTransformer> {
    let tsCompilerOptions: AngularCompilerOptions | undefined;
    if (typeof opts === 'string') {
      const { readConfiguration } = await loadEsmModule('@angular/compiler-cli');
      tsCompilerOptions = readConfiguration(opts).options;
    } else {
      tsCompilerOptions = opts;
    }

    this.tsCompilerOptions = tsCompilerOptions;
    this.bitCompilerOptions = bitCompilerOptions;
    return this.envs.override({
      getCompiler: () => {
        // @ts-ignore
        return this.angularEnv.getCompiler(tsCompilerOptions, bitCompilerOptions, this.ngEnvOptions);
      },
      getBuildPipe: () => {
        // @ts-ignore
        return this.angularEnv.getBuildPipe(tsCompilerOptions, bitCompilerOptions, this.ngEnvOptions);
      }
    });
  }
}

AngularV13Aspect.addRuntime(AngularV13Main);

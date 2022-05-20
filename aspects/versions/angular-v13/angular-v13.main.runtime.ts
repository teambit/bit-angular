import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { AngularBaseMain, AngularEnvOptions, loadEsmModule } from '@teambit/angular-base';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { CompilerMain, CompilerOptions } from '@teambit/compiler';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvsMain, EnvTransformer } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { NgMultiCompilerMain } from '@teambit/ng-multi-compiler';
import { PkgMain } from '@teambit/pkg';
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularElementsMain } from '@teambit/angular-elements';
import { AngularV13Aspect } from './angular-v13.aspect';
import { AngularV13Env } from './angular-v13.env';

export class AngularV13Main extends AngularBaseMain {
  static async provider([
    jestAspect,
    compiler,
    tester,
    eslint,
    ngMultiCompiler,
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
    angularElements,
  ]: [
    JestMain,
    CompilerMain,
    TesterMain,
    ESLintMain,
    NgMultiCompilerMain,
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
    AngularElementsMain,
  ], options: AngularEnvOptions): Promise<AngularBaseMain> {
    const angularV13Env = new AngularV13Env(
      jestAspect,
      compiler,
      tester,
      eslint,
      ngMultiCompiler,
      generator,
      isolator,
      webpack,
      workspace,
      pkg,
      application,
      aspectLoader,
      dependencyResolver,
      react,
      options,
      angularElements,
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

    return this.envs.override({
      getCompiler: () => {
        // @ts-ignore
        return this.angularEnv.getCompiler(tsCompilerOptions, bitCompilerOptions);
      },
      getBuildPipe: () => {
        // @ts-ignore
        return this.angularEnv.getBuildPipe(tsCompilerOptions, bitCompilerOptions);
      }
    });
  }

  /**
   * Use Rollup & Angular Elements to compile compositions instead of webpack.
   * This transforms compositions into Web Components and replaces the Angular bundler by the React bundler.
   */
  useAngularElements(): EnvTransformer {
    return this.envs.override({
      useAngularElements: true
    });
  }
}

AngularV13Aspect.addRuntime(AngularV13Main);

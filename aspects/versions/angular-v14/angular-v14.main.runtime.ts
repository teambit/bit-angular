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
import { AngularV14Aspect } from './angular-v14.aspect';
import { AngularV14Env } from './angular-v14.env';

export class AngularV14Main extends AngularBaseMain {
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
    options.useAngularElementsPreview = true;
    const angularv14Env = new AngularV14Env(
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
    return new AngularV14Main(envs, angularv14Env);
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
}

AngularV14Aspect.addRuntime(AngularV14Main);

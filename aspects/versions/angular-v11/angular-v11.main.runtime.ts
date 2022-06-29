import { AngularBaseMain, AngularEnvOptions } from '@teambit/angular-base';
import { AngularElementsMain } from '@teambit/angular-elements';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { CompilerMain } from '@teambit/compiler';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvsMain } from '@teambit/envs';
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
import { AngularV11Aspect } from './angular-v11.aspect';
import { AngularV11Env } from './angular-v11.env';

export class AngularV11Main extends AngularBaseMain {
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
    angularElements
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
    const angularV11Env = new AngularV11Env(
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
      angularElements
    );
    return new AngularV11Main(envs, angularV11Env);
  }
}

AngularV11Aspect.addRuntime(AngularV11Main);

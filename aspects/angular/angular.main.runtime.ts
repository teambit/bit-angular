import { AngularBaseMain, AngularEnvOptions } from '@teambit/angular-base';
import { AngularV13Main } from '@teambit/angular-v13';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { CompilerMain } from '@teambit/compiler';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvsMain } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { PkgMain } from '@teambit/pkg';
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularElementsMain } from '@teambit/angular-elements';
import { NgMultiCompilerMain } from '@teambit/ng-multi-compiler';
import { AngularAspect } from './angular.aspect';
import { AngularEnv } from './angular.env';

export class AngularMain extends AngularV13Main {
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
    AngularElementsMain
  ], options: AngularEnvOptions): Promise<AngularBaseMain> {
    const angularEnv = new AngularEnv(
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
    return new AngularMain(envs, angularEnv);
  }
}

AngularAspect.addRuntime(AngularMain);

import { AngularBaseMain, AngularEnvOptions } from '@teambit/angular-base';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { AspectLoaderAspect, AspectLoaderMain } from '@teambit/aspect-loader';
import { BabelAspect, BabelMain } from '@teambit/babel';
import { MainRuntime } from '@teambit/cli';
import { CompilerAspect, CompilerMain } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvsAspect, EnvsMain } from '@teambit/envs';
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
import { AngularV10Aspect } from './angular-v10.aspect';
import { AngularV10Env } from './angular-v10.env';

export class AngularV10Main extends AngularBaseMain {
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
    const angularV10Env = new AngularV10Env(
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
    return new AngularV10Main(envs, angularV10Env);
  }
}

AngularV10Aspect.addRuntime(AngularV10Main);

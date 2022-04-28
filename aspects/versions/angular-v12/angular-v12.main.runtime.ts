import { AngularBaseMain } from '@teambit/angular-base';
import { ApplicationMain } from '@teambit/application';
import { AspectLoaderMain } from '@teambit/aspect-loader';
import { BabelMain } from '@teambit/babel';
import { CompilerMain } from '@teambit/compiler';
import { DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvsMain } from '@teambit/envs';
import { ESLintMain } from '@teambit/eslint';
import { GeneratorMain } from '@teambit/generator';
import { IsolatorMain } from '@teambit/isolator';
import { JestMain } from '@teambit/jest';
import { MultiCompilerMain } from '@teambit/multi-compiler';
import { NgPackagrMain } from '@teambit/ng-packagr';
import { PkgMain } from '@teambit/pkg';
import { ReactMain } from '@teambit/react';
import { TesterMain } from '@teambit/tester';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Env } from './angular-v12.env';

export class AngularV12Main extends AngularBaseMain {
  static async provider([
    jestAspect,
    compiler,
    tester,
    eslint,
    ngPackagr,
    generator,
    webpack,
    workspace,
    envs,
    isolator,
    pkg,
    application,
    aspectLoader,
    multicompiler,
    babel,
    dependencyResolver,
    react,
  ]: [
    JestMain,
    CompilerMain,
    TesterMain,
    ESLintMain,
    NgPackagrMain,
    GeneratorMain,
    WebpackMain,
      Workspace | undefined,
    EnvsMain,
    IsolatorMain,
    PkgMain,
    ApplicationMain,
    AspectLoaderMain,
    MultiCompilerMain,
    BabelMain,
    DependencyResolverMain,
    ReactMain,
  ]): Promise<AngularBaseMain> {
    const angularV12Env = new AngularV12Env(
      jestAspect,
      compiler,
      tester,
      eslint,
      ngPackagr,
      generator,
      isolator,
      webpack,
      workspace,
      pkg,
      application,
      aspectLoader,
      multicompiler,
      babel,
      dependencyResolver,
      react,
    );
    return new AngularV12Main(envs, angularV12Env);
  }
}

AngularV12Aspect.addRuntime(AngularV12Main);

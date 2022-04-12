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
import { TesterMain } from '@teambit/tester';
import { WebpackMain } from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularV9Aspect } from './angular-v9.aspect';
import { AngularV9Env } from './angular-v9.env';

export class AngularV9Main extends AngularBaseMain {
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
    DependencyResolverMain
  ]): Promise<AngularBaseMain> {
    const angularV9Env = new AngularV9Env(
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
    );
    return new AngularV9Main(envs, angularV9Env);
  }
}

AngularV9Aspect.addRuntime(AngularV9Main);

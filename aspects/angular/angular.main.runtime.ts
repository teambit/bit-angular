import { AngularBaseMain } from '@teambit/angular-base';
import { AngularV13Main } from '@teambit/angular-v13';
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
import { AngularAspect } from './angular.aspect';
import { AngularEnv } from './angular.env';

export class AngularMain extends AngularV13Main {
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
    const angularEnv = new AngularEnv(
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
    // @ts-ignore
    return new AngularMain(envs, angularEnv);
  }
}

AngularAspect.addRuntime(AngularMain);

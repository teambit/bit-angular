import { MainRuntime } from '@teambit/cli';
import { CompilerAspect, CompilerMain } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { EnvsAspect, EnvsMain } from '@teambit/envs';
import { ESLintAspect, ESLintMain } from '@teambit/eslint';
import { GeneratorAspect, GeneratorMain } from '@teambit/generator';
import { JestAspect, JestMain } from '@teambit/jest';
import { NgPackagrAspect, NgPackagrMain } from '@teambit/ng-packagr';
import { WebpackAspect, WebpackMain } from '@teambit/webpack';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { AngularPreview } from '@teambit/angular';
import { AngularV12Aspect } from './angular-v12.aspect';
import { AngularV12Env } from './angular-v12.env';

type AngularV12Deps = [
  JestMain,
  CompilerMain,
  ESLintMain,
  NgPackagrMain,
  GeneratorMain,
  WebpackMain,
  Workspace,
  CompositionsMain,
  EnvsMain,
];

export class AngularV12Main {
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

  constructor(readonly angularV12Env: AngularV12Env) {}

  static async provider([
    jestAspect,
    compiler,
    eslint,
    ngPackagr,
    generator,
    webpack,
    workspace,
    compositions,
    envs,
  ]: AngularV12Deps) {
    const angularV12Env = new AngularV12Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      webpack,
      workspace,
      compositions,
    );
    const angularV12Main = new AngularV12Main(angularV12Env);
    envs.registerEnv(angularV12Env);
    return angularV12Main;
  }
}

AngularV12Aspect.addRuntime(AngularPreview);
AngularV12Aspect.addRuntime(AngularV12Main);

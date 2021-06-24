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
import { AngularV11Aspect } from './angular-v11.aspect';
import { AngularV11Env } from './angular-v11.env';

type AngularV11Deps = [
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

export class AngularV11Main {
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

  constructor(readonly angularV11Env: AngularV11Env) {}

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
  ]: AngularV11Deps) {
    const angularV11Env = new AngularV11Env(
      jestAspect,
      compiler,
      eslint,
      ngPackagr,
      generator,
      webpack,
      workspace,
      compositions,
    );
    const angularV11Main = new AngularV11Main(angularV11Env);
    envs.registerEnv(angularV11Env);
    return angularV11Main;
  }
}

AngularV11Aspect.addRuntime(AngularPreview);
AngularV11Aspect.addRuntime(AngularV11Main);

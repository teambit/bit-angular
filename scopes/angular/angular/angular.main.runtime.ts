import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { MainRuntime } from '@teambit/cli';
import { CompilerAspect, CompilerMain } from '@teambit/compiler';
import CompositionsAspect, { CompositionsMain } from '@teambit/compositions';
import { EnvsAspect, EnvsMain } from '@teambit/envs';
import { ESLintAspect, ESLintMain } from '@teambit/eslint';
import { GeneratorAspect, GeneratorMain } from '@teambit/generator';
import { JestAspect, JestMain } from '@teambit/jest';
import { NgPackagrAspect, NgPackagrMain } from '@teambit/ng-packagr';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import TesterAspect, { TesterMain } from '@teambit/tester';
import { TypescriptAspect, TypescriptMain } from '@teambit/typescript';
import { WebpackAspect, WebpackMain } from '@teambit/webpack';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { AngularAspect } from './angular.aspect';
import { AngularEnv } from './angular.env';
import { componentTemplates } from './angular.templates';

export type AngularMainConfig = {
  /**
   * configure the component tester.
   * can be either Jest ('jest') or Mocha ('mocha')
   */
  // tester: 'jest' | 'mocha';

  /**
   * version of Angular to configure.
   */
  angularVersion?: number;
};

type AngularDeps = [
  EnvsMain,
  JestMain,
  TypescriptMain,
  CompilerMain,
  WebpackMain,
  Workspace,
  PkgMain,
  TesterMain,
  ESLintMain,
  ApplicationMain,
  GeneratorMain,
  NgPackagrMain,
  CompositionsMain
];

export class AngularMain {
  static slots = [];
  static dependencies: any = [
    EnvsAspect,
    JestAspect,
    TypescriptAspect,
    CompilerAspect,
    WebpackAspect,
    WorkspaceAspect,
    PkgAspect,
    TesterAspect,
    ESLintAspect,
    ApplicationAspect,
    GeneratorAspect,
    NgPackagrAspect,
    CompositionsAspect
  ];
  static runtime: any = MainRuntime;

  constructor(readonly angularEnv: AngularEnv) {}

  static async provider([
    envs,
    jestAspect,
    tsAspect,
    compiler,
    webpack,
    workspace,
    pkg,
    tester,
    eslint,
    application,
    generator,
    ngPackagr,
    compositions
  ]: AngularDeps, config: AngularMainConfig) {
    const angularEnv = new AngularEnv(
      config,
      jestAspect,
      tsAspect,
      compiler,
      webpack,
      workspace,
      pkg,
      tester,
      eslint,
      ngPackagr,
      compositions
    );
    await angularEnv.useVersion(config.angularVersion);
    const angularMain = new AngularMain(angularEnv);
    envs.registerEnv(angularEnv);
    generator.registerComponentTemplate(componentTemplates);
    return angularMain;
  }
}

AngularAspect.addRuntime(AngularMain);

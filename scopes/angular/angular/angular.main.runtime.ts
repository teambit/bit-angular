import { MainRuntime } from '@teambit/cli';
import { GeneratorAspect, GeneratorMain } from '@teambit/generator';
import { ESLintAspect, ESLintMain } from '@teambit/eslint';
import { EnvsAspect, EnvsMain } from '@teambit/envs';
import { JestAspect, JestMain } from '@teambit/jest';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { TypescriptAspect, TypescriptMain } from '@teambit/typescript';
import { WebpackAspect, WebpackMain } from '@teambit/webpack';
import { CompilerAspect, CompilerMain } from '@teambit/compiler';
import TesterAspect, { TesterMain } from '@teambit/tester';
import { NgPackagrAspect, NgPackagrMain } from '@teambit/ng-packagr';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import PreviewAspect, { PreviewMain } from '@teambit/preview';
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
  CompositionsMain,
  PreviewMain
];

export class AngularMain {
  static slots = [];
  static dependencies = [
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
    CompositionsAspect,
    PreviewAspect
  ];
  static runtime = MainRuntime;

  constructor(
    /**
     * an instance of the Angular env.
     */
    readonly angularEnv: AngularEnv
  ) {}

  /**
   * override the env's dev server and preview webpack configurations.
   * Replaces both overrideDevServerConfig and overridePreviewConfig
   */
  // useWebpack = this.react.useWebpack.bind(this.react);

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
    compositions,
    preview
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
      compositions,
      preview
    );
    await angularEnv.useVersion(config.angularVersion);
    const angularMain = new AngularMain(angularEnv);
    envs.registerEnv(angularEnv);
    generator.registerComponentTemplate(componentTemplates);
    return angularMain;
  }
}

AngularAspect.addRuntime(AngularMain);

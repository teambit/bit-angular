import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import {
  AngularElementsAspect,
  AngularElementsMain,
  RollupCompiler
} from '@teambit/angular-elements';
import { MainRuntime } from '@teambit/cli';
import { Compiler, CompilerOptions } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { NgPackagrAspect } from './ng-packagr.aspect';
import { NgPackagrCompiler } from './ng-packagr.compiler';

type NgPackagerMain = [LoggerMain, Workspace, ApplicationMain, CompositionsMain, AngularElementsMain];

export class NgPackagrMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, ApplicationAspect, CompositionsAspect, AngularElementsAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private application: ApplicationMain, private compositions: CompositionsMain, private rollupCompiler: RollupCompiler) {}

  createCompiler(
    ngPackagr: string,
    readDefaultTsConfig: string,
    tsCompilerOptions?: AngularCompilerOptions,
    bitCompilerOptions?: Partial<CompilerOptions>,
    nodeModulesPaths: string[] = []
  ): Compiler {
    return new NgPackagrCompiler(
      NgPackagrAspect.id,
      ngPackagr,
      this.logger,
      this.workspace,
      readDefaultTsConfig,
      this.compositions,
      this.rollupCompiler,
      tsCompilerOptions,
      bitCompilerOptions,
      nodeModulesPaths,
      this.application
    );
  }

  static async provider([loggerMain, workspace, application, compositions, angularElementsMain]: NgPackagerMain) {
    const logger = loggerMain.createLogger(NgPackagrAspect.id);
    const rollupCompiler = angularElementsMain.createCompiler();
    return new NgPackagrMain(logger, workspace, application, compositions, rollupCompiler);
  }
}

NgPackagrAspect.addRuntime(NgPackagrMain);

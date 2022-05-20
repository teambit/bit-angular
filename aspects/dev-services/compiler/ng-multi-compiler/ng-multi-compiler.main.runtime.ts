import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { AngularElementsMain } from '@teambit/angular-elements';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { MainRuntime } from '@teambit/cli';
import { Compiler, CompilerOptions } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { NgPackagrAspect, NgPackagrMain } from '@teambit/ng-packagr';
import { BabelAspect, BabelMain } from '@teambit/babel';
import { NgMultiCompiler } from './ng-multi-compiler';
import { NgMultiCompilerAspect } from './ng-multi-compiler.aspect';

type NgMultiCompilerDeps = [LoggerMain, Workspace, ApplicationMain, CompositionsMain, NgPackagrMain, BabelMain];

export class NgMultiCompilerMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, ApplicationAspect, CompositionsAspect, NgPackagrAspect, BabelAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private application: ApplicationMain, private compositions: CompositionsMain, private ngPackagr: NgPackagrMain, private babel: BabelMain) {}

  createCompiler(
    ngPackagrPath: string,
    useElements: boolean,
    readDefaultTsConfig: string,
    tsCompilerOptions?: AngularCompilerOptions,
    bitCompilerOptions?: Partial<CompilerOptions>,
    nodeModulesPaths: string[] = [],
    angularElements?: AngularElementsMain
  ): Compiler {
    return new NgMultiCompiler(
      NgMultiCompilerAspect.id,
      ngPackagrPath,
      this.ngPackagr,
      useElements,
      angularElements,
      this.babel,
      readDefaultTsConfig,
      this.logger,
      this.workspace,
      this.compositions,
      this.application,
      tsCompilerOptions,
      bitCompilerOptions,
      nodeModulesPaths,
    );
  }

  static async provider([loggerMain, workspace, application, compositions, ngPackagr, babel]: NgMultiCompilerDeps) {
    const logger = loggerMain.createLogger(NgMultiCompilerAspect.id);
    return new NgMultiCompilerMain(logger, workspace, application, compositions, ngPackagr, babel);
  }
}

NgMultiCompilerAspect.addRuntime(NgMultiCompilerMain);

import { MainRuntime } from '@teambit/cli';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Compiler, CompilerOptions } from '@teambit/compiler';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { CompilerOptions as TsCompilerOptions } from '@angular/compiler-cli';
import { NgPackagrAspect } from './ng-packagr.aspect';
import { NgPackagr, NgPackagrCompiler } from './ng-packagr.compiler';

type NgPackagerMain = [LoggerMain, Workspace];

export class NgPackagrMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace) {}

  createCompiler(
    ngPackagr: NgPackagr,
    readDefaultTsConfig: (filename?: string) => any,
    tsCompilerOptions?: TsCompilerOptions,
    bitCompilerOptions?: Partial<CompilerOptions>,
    nodeModulesPaths: string[] = []
  ): Compiler {
    return new NgPackagrCompiler(
      NgPackagrAspect.id,
      ngPackagr,
      this.logger,
      this.workspace,
      readDefaultTsConfig,
      tsCompilerOptions,
      bitCompilerOptions,
      nodeModulesPaths
    );
  }

  static async provider([loggerExt, workspace]: NgPackagerMain) {
    const logger = loggerExt.createLogger(NgPackagrAspect.id);
    return new NgPackagrMain(logger, workspace);
  }
}

NgPackagrAspect.addRuntime(NgPackagrMain);

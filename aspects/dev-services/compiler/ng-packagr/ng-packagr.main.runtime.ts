import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { MainRuntime } from '@teambit/cli';
import { Compiler, CompilerOptions } from '@teambit/compiler';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { NgPackagrAspect } from './ng-packagr.aspect';
import { NgPackagrCompiler } from './ng-packagr.compiler';

type NgPackagerMain = [LoggerMain, Workspace, ApplicationMain];

export class NgPackagrMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, ApplicationAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private application: ApplicationMain) {}

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
      tsCompilerOptions,
      bitCompilerOptions,
      nodeModulesPaths,
      this.application
    );
  }

  static async provider([loggerExt, workspace, application]: NgPackagerMain) {
    const logger = loggerExt.createLogger(NgPackagrAspect.id);
    return new NgPackagrMain(logger, workspace, application);
  }
}

NgPackagrAspect.addRuntime(NgPackagrMain);

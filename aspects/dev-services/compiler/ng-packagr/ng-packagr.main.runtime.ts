import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { MainRuntime } from '@teambit/cli';
import { Compiler } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { NgPackagrAspect } from './ng-packagr.aspect';
import { NgPackagrCompiler } from './ng-packagr.compiler';

type NgPackagerMain = [LoggerMain, Workspace, ApplicationMain, CompositionsMain];

export class NgPackagrMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, ApplicationAspect, CompositionsAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private application: ApplicationMain, private compositions: CompositionsMain) {}

  createCompiler(
    ngPackagrPath: string,
    readDefaultTsConfig: string,
    distDir: string,
    distGlobPatterns: string[],
    shouldCopyNonSupportedFiles: boolean,
    artifactName: string,
    tsCompilerOptions?: AngularCompilerOptions,
    nodeModulesPaths: string[] = [],
  ): Compiler {
    return new NgPackagrCompiler(
      NgPackagrAspect.id,
      ngPackagrPath,
      readDefaultTsConfig,
      this.logger,
      this.workspace,
      this.compositions,
      this.application,
      distDir,
      distGlobPatterns,
      shouldCopyNonSupportedFiles,
      artifactName,
      tsCompilerOptions,
      nodeModulesPaths,
    );
  }

  static async provider([loggerMain, workspace, application, compositions]: NgPackagerMain) {
    const logger = loggerMain.createLogger(NgPackagrAspect.id);
    return new NgPackagrMain(logger, workspace, application, compositions);
  }
}

NgPackagrAspect.addRuntime(NgPackagrMain);

import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { ApplicationAspect, ApplicationMain } from '@teambit/application';
import { MainRuntime } from '@teambit/cli';
import { Compiler } from '@teambit/compiler';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { AngularElementsAspect } from './angular-elements.aspect';
import { AngularElementsCompiler } from './angular-elements.compiler';

type AngularElementsDeps = [LoggerMain, Workspace, ApplicationMain, CompositionsMain];

export class AngularElementsMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, ApplicationAspect, CompositionsAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private application: ApplicationMain, private compositions: CompositionsMain) {
  }

  createCompiler(
    distDir: string,
    distGlobPatterns: string[],
    shouldCopyNonSupportedFiles: boolean,
    artifactName: string,
    tsCompilerOptions?: AngularCompilerOptions,
    nodeModulesPaths: string[] = []
  ): Compiler {
    return new AngularElementsCompiler(
      AngularElementsAspect.id,
      this.logger,
      this.workspace,
      this.compositions,
      this.application,
      distDir,
      distGlobPatterns,
      shouldCopyNonSupportedFiles,
      artifactName,
      tsCompilerOptions,
      nodeModulesPaths
    );
  }

  static async provider([loggerMain, workspace, application, compositions]: AngularElementsDeps) {
    const logger = loggerMain.createLogger(AngularElementsAspect.id);
    return new AngularElementsMain(logger, workspace, application, compositions);
  }
}

AngularElementsAspect.addRuntime(AngularElementsMain);

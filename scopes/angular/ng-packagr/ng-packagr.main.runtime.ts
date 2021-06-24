import { MainRuntime } from '@teambit/cli';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Compiler } from '@teambit/compiler';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { TsConfigSourceFile } from 'typescript';
import { NgPackagrOptions } from './ng-packagr-options';
import { NgPackagrAspect } from './ng-packagr.aspect';
import { NgPackagr, NgPackagrCompiler } from './ng-packagr.compiler';

type NgPackagerMain = [LoggerMain, Workspace];

export class NgPackagrMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace) {}

  createCompiler(ngPackagr: NgPackagr, tsConfig?: TsConfigSourceFile, options: NgPackagrOptions = {}): Compiler {
    return new NgPackagrCompiler(NgPackagrAspect.id, ngPackagr, this.logger, this.workspace, tsConfig, options);
  }

  static async provider([loggerExt, workspace]: NgPackagerMain) {
    const logger = loggerExt.createLogger(NgPackagrAspect.id);
    return new NgPackagrMain(logger, workspace);
  }
}

NgPackagrAspect.addRuntime(NgPackagrMain);

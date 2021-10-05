import { MainRuntime } from '@teambit/cli';
import { HarmonyWorker } from '@teambit/worker';
import { WorkerAspect, WorkerMain } from '@teambit/worker';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Compiler, CompilerOptions } from '@teambit/compiler';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { CompilerOptions as TsCompilerOptions } from '@angular/compiler-cli';
import { NgPackagrAspect } from './ng-packagr.aspect';
import { NgPackagrCompiler } from './ng-packagr.compiler';
import type { NgPackagrWorker } from './ng-packagr.worker';

type NgPackagerMain = [LoggerMain, Workspace, WorkerMain];
const WORKER_NAME = 'ng-packagr';

export class NgPackagrMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, WorkerAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private ngPackagrWorker: HarmonyWorker<NgPackagrWorker>) {}

  createCompiler(
    ngPackagr: string,
    readDefaultTsConfig: string,
    tsCompilerOptions?: TsCompilerOptions,
    bitCompilerOptions?: Partial<CompilerOptions>,
    nodeModulesPaths: string[] = []
  ): Compiler {
    return new NgPackagrCompiler(
      NgPackagrAspect.id,
      ngPackagr,
      this.ngPackagrWorker,
      this.logger,
      this.workspace,
      readDefaultTsConfig,
      tsCompilerOptions,
      bitCompilerOptions,
      nodeModulesPaths
    );
  }

  static async provider([loggerExt, workspace, worker]: NgPackagerMain) {
    const logger = loggerExt.createLogger(NgPackagrAspect.id);
    const ngPackagrWorker = await worker.declareWorker<NgPackagrWorker>(WORKER_NAME, require.resolve('./ng-packagr.worker'));
    return new NgPackagrMain(logger, workspace, ngPackagrWorker);
  }
}

NgPackagrAspect.addRuntime(NgPackagrMain);

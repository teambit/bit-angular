import { MainRuntime } from '@teambit/cli';
import { CompositionsAspect, CompositionsMain } from '@teambit/compositions';
import { Logger, LoggerAspect, LoggerMain } from '@teambit/logger';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { AngularElementsAspect } from './angular-elements.aspect';
import { RollupCompiler } from './rollup/rollup.compiler';

export type ngElementsMain = [LoggerMain, Workspace, CompositionsMain];

export class AngularElementsMain {
  static slots = [];
  static dependencies: any = [LoggerAspect, WorkspaceAspect, CompositionsAspect];
  static runtime: any = MainRuntime;

  constructor(private logger: Logger, private workspace: Workspace, private compositions: CompositionsMain) {}

  createCompiler() {
    return new RollupCompiler(this.logger);
  }

  static async provider([loggerMain, workspace, compositions]: ngElementsMain) {
    const logger = loggerMain.createLogger(AngularElementsAspect.id);
    return new AngularElementsMain(logger, workspace, compositions);
  }
}

AngularElementsAspect.addRuntime(AngularElementsMain);

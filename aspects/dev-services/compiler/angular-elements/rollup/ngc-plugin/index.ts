import type { CompilerHost, AngularCompilerOptions } from '@angular/compiler-cli';
import { Logger } from '@teambit/logger';
import { resolve } from 'path';
import { Plugin } from 'rollup';
import {
  CompilerHost as TsCompilerHost,
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget
} from 'typescript';
import { ngCompilerCli } from '../utils/ng-compiler-cli';
import { compile } from './compile';
// import { defautSideEffects, optimizer, OptimizerOptions } from './optimizer';

import { resolver } from './resolver';

export interface Options {
  rootDir: string;
  sourceMap?: boolean;
  target?: string;
  // buildOptimizer?: OptimizerOptions;
}

export async function ngcPlugin(options: Options, logger: Logger): Promise<Plugin> {
  let host: CompilerHost & TsCompilerHost;
  const files = new Map();
  // let sideEffectFreeModules: string[];
  const { createCompilerHost } = await ngCompilerCli();

  const { target = 'es2018', rootDir, sourceMap = true } = options;
  const scriptTarget = ScriptTarget[Number(target.toLocaleUpperCase())] as any;

  const opts = {
    target: scriptTarget,
    module: ModuleKind.ESNext,
    lib: [ 'dom', 'es2015', 'es2017', 'es2018', 'es2019' ],
    rootDir: resolve(rootDir),
    moduleResolution: ModuleResolutionKind.NodeJs,
    esModuleInterop: true,
    declaration: false,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    enableIvy: true,
    sourceMap
  } as any as AngularCompilerOptions;

  return {
    name: 'ngc',
    buildStart: () => {
      logger.setStatusLine('Starting ngc compilation');
      // sideEffectFreeModules = defautSideEffects(options?.buildOptimizer?.sideEffectFreeModules)
      host = createCompilerHost({ options: opts }) as CompilerHost & TsCompilerHost;
      host.writeFile = (fileName: string, contents: string) => files.set(fileName, contents)
    },
    resolveId: resolver(),
    async transform(code: string, id: string) {
      logger.setStatusLine(`Transforming ${id}`);
      if (!id.includes('node_modules')) {
        // eslint-disable-next-line @typescript-eslint/return-await
        return await compile({ id: resolve(id).replace(/\\/g, '/'), host, options: opts, files });
      }
      // TODO: optimize for prod only
      /*return optimizer(code, id, {
        sideEffectFreeModules,
        angularCoreModules: options?.buildOptimizer?.angularCoreModules
      })*/
    }
  }
}

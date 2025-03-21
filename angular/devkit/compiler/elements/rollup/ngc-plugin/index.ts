// @ts-ignore
import type { AngularCompilerOptions, CompilerHost } from '@angular/compiler-cli';
import { Logger } from '@teambit/logger';
import { resolve } from 'path';
import { Plugin } from 'rollup';
import {
  CompilerHost as TsCompilerHost,
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget
} from 'typescript';
import type { CompilationMode } from '../rollup.compiler';
import { ngCompilerCli } from '../utils/ng-compiler-cli';
import { compile } from './compile';
import { resolver } from './resolver';


export interface Options {
  rootDir: string;
  sourceMap?: boolean;
  target?: string;
  internals?: string[];
  externals?: string[];
  tsCompilerOptions?: AngularCompilerOptions;
  compilationMode: CompilationMode;
}

export async function ngcPlugin(options: Options, logger: Logger): Promise<Plugin> {
  let host: CompilerHost & TsCompilerHost;
  const files = new Map();
  // let sideEffectFreeModules: string[];
  // @ts-ignore
  const { createCompilerHost } = await ngCompilerCli();
  const internals = options.internals || [];
  const externals = options.externals || [];

  const { target = 'es2018', rootDir, sourceMap = true } = options;
  const scriptTarget = ScriptTarget[Number(target.toLocaleUpperCase())] as any || ScriptTarget.ESNext;

  const opts = {
    target: scriptTarget,
    module: ModuleKind.ESNext,
    lib: [ 'dom', 'es2015', 'es2017', 'es2018', 'es2019' ],
    rootDir: resolve(rootDir),
    moduleResolution: ModuleResolutionKind.NodeJs,
    esModuleInterop: true,
    declaration: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    enableIvy: true,
    allowJs: true,
    sourceMap,
    ...options.tsCompilerOptions,
    compilationMode: options.compilationMode,
  } as any as AngularCompilerOptions;

  return {
    name: 'ngc',
    buildStart: () => {
      logger.setStatusLine('Starting ngc compilation');
      host = createCompilerHost({ options: opts }) as CompilerHost & TsCompilerHost;
      host.writeFile = (fileName: string, contents: string) => files.set(fileName, contents)
    },
    resolveId: resolver(),
    // eslint-disable-next-line consistent-return
    async transform(code: string, id: string) {
      logger.setStatusLine(`Transforming ${id}`);
      if ((!id.includes('node_modules') || internals.some(exception => id.includes(exception))) && externals.every(external => !id.includes(external))) {
        // eslint-disable-next-line @typescript-eslint/return-await
        const res = await compile({ id: resolve(id).replace(/\\/g, '/'), host, options: opts, files });
        // Manually force import the jit compiler at the beginning of the files
        res.code = `import '@angular/compiler';\n${  res.code}`;
        return res;
      }
    }
  }
}

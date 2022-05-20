import type { CompilerHost, CompilerOptions } from '@angular/compiler-cli';
import { CompilerOptions as TsCompilerOptions } from 'typescript';
import { ngCompilerCli } from '../utils/ng-compiler-cli';

export interface CompileOptions {
  id: string;
  host: CompilerHost;
  options: CompilerOptions & TsCompilerOptions;
  files: Map<string, string>;
}

export async function compile(opts: CompileOptions) {
  const { id, host, options, files } = opts;
  const { createProgram } = await ngCompilerCli();

  const program = createProgram({ rootNames: [id], options, host });
  program.emit();

  const file = id.replace('.ts', '');

  const map = files.get(`${ file }.js.map`);
  const code = files.get(`${ file }.js`);

  return {
    code: (code ?? '').replace(/\/\/# sourceMappingURL.*/, ''),
    map
  }
}

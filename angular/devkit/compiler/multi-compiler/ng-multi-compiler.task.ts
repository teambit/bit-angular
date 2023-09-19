// TODO: @gilad create compiler task as a component. (teambit.compilation/compiler-task)
import { TaskHandler } from '@teambit/builder';
import { CompilerTask } from '@teambit/compilation.compiler-task';
import { Compiler } from '@teambit/compiler';
import { EnvHandler } from '@teambit/envs';

export interface NgMultiCompilerTaskOptions {
  name?: string;
  description?: string;
  ngMultiCompiler: EnvHandler<Compiler>;
}

export const NgMultiCompilerTask = {
  from: (options: NgMultiCompilerTaskOptions): TaskHandler => {
    const name = options.name || 'NgMultiCompiler';
    const description = options.description || 'compiling components using NgMultiCompiler';

    return CompilerTask.from({
      name,
      description,
      compiler: options.ngMultiCompiler
    });
  }
}

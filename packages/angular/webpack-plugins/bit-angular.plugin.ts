import type { Compilation } from 'webpack';
import { initializeNgccProcessor, NgccProcessor } from './ngcc-processor';

const PLUGIN_NAME = 'bit-angular-compiler';

export function addWarning(compilation: Compilation, message: string): void {
  compilation.warnings.push(new compilation.compiler.webpack.WebpackError(message));
}

export function addError(compilation: Compilation, message: string): void {
  compilation.errors.push(new compilation.compiler.webpack.WebpackError(message));
}

export class BitAngularPlugin {
  constructor(private tsconfigPath: string, private nodeModulesPaths: string[]) {}
  apply(compiler: any): void {
    let ngccProcessor: NgccProcessor | undefined;
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      // Initialize and process eager ngcc if not already setup
      if (!ngccProcessor) {
        const { processor, errors, warnings } = initializeNgccProcessor(
          compiler,
          this.tsconfigPath,
        );

        this.nodeModulesPaths.forEach(path => {
          processor.process(path);
        });
        warnings.forEach((warning) => addWarning(compilation, warning));
        errors.forEach((error) => addError(compilation, error));

        ngccProcessor = processor;
      }
    });

    compiler.hooks
  }
}

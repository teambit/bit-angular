import { ComponentContext, ComponentTemplate, ComponentTemplateOptions, ComponentConfig } from '@teambit/generator';
import { indexFile } from './files/index';
import { aspectFile } from './files/aspect-file';
import { mainRuntime } from './files/main-runtime';

export class BitAspectTemplate implements ComponentTemplate {
  constructor(
    readonly name = 'bit-aspect',
    readonly description = 'extend Bit capabilities with an ESM aspect',
    readonly hidden = false,
    readonly envs?: string
  ) {
  }

  generateFiles(context: ComponentContext) {
    return [
      {
        relativePath: 'index.ts',
        content: indexFile(context),
        isMain: true,
      },
      {
        relativePath: `${context.name}.aspect.ts`,
        content: aspectFile(context),
      },
      {
        relativePath: `${context.name}.main.runtime.ts`,
        content: mainRuntime(context),
      },
    ];
  }

  config(): ComponentConfig {
    return {
      'bitdev.general/envs/bit-aspect-env': {},
      'teambit.envs/envs': {
        env: 'bitdev.general/envs/bit-aspect-env',
      },
    };
  }

  static from(options: ComponentTemplateOptions = {}) {
    return () => new BitAspectTemplate(options.name, options.description, options.hidden, options.env);
  }
}

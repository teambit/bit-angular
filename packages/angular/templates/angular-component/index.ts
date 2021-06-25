import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { componentFile } from './src/lib/component';
import { componentSpecFile } from './src/lib/component-spec';
import { compositionFile } from './src/lib/composition';
import { docsFile } from './src/lib/docs';
import { moduleFile } from './src/lib/module';
import { publicApiFile } from './src/public-api';

export const angularModule: ComponentTemplate = {
  name: 'ng-lib',
  description: 'a generic Angular library',
  hidden: false,

  generateFiles(context: ComponentContext) {
    return [
      publicApiFile(context),
      componentFile(context),
      moduleFile(context),
      docsFile(context),
      componentSpecFile(context),
      compositionFile(context),
    ];
  },
};

import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { componentFile } from './template-files/src/component';
import { componentSpecFile } from './template-files/src/component-spec';
import { compositionFile } from './template-files/src/composition';
import { docsFile } from './template-files/src/docs';
import { moduleFile } from './template-files/src/module';
import { publicApiFile } from './template-files/public-api';

export const ngLibTemplate: ComponentTemplate = {
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

import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { componentFile } from './template-files/src/component';
import { componentSpecFile } from './template-files/src/component-spec';
import { componentStylesFile } from './template-files/src/component-styles';
import { compositionFile } from './template-files/src/composition';
import { docsFile } from './template-files/src/docs';
import { moduleFile } from './template-files/src/module';
import { publicApiFile } from './template-files/public-api';

export const ngModuleTemplate: ComponentTemplate = {
  name: 'ng-module',
  description: 'a generic Angular module',

  generateFiles(context: ComponentContext) {
    return [
      publicApiFile(context),
      componentFile(context),
      componentStylesFile(context),
      moduleFile(context),
      docsFile(context),
      componentSpecFile(context),
      compositionFile(context),
    ];
  },
};

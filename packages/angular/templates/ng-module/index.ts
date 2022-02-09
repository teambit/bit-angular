import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { componentFile } from './template-files/component';
import { componentSpecFile } from './template-files/component-spec';
import { componentStylesFile } from './template-files/component-styles';
import { compositionFile } from './template-files/composition';
import { docsFile } from './template-files/docs';
import { moduleFile } from './template-files/module';
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

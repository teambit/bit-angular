import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@bitdev/angular.dev-services.common';
import { componentFile } from './files/component';
import { componentSpecFile } from './files/component-spec';
import { componentStylesFile } from './files/component-styles';
import { compositionFile } from './files/composition';
import { docsFile } from './files/docs';
import { moduleFile } from './files/module';
import { publicApiFile } from './files/public-api';

export class NgModuleTemplate implements ComponentTemplate {
  private constructor(
    readonly angularVersion: number,
    readonly name = 'ng-module',
    readonly description = 'create a generic Angular module',
    readonly hidden = false
  ) {}

  generateFiles(context: ComponentContext) {
    return [
      publicApiFile(context),
      componentFile(context),
      componentStylesFile(context),
      moduleFile(context),
      docsFile(context),
      componentSpecFile(context),
      compositionFile(context, this.angularVersion),
    ];
  }

  static from(options: AngularComponentTemplateOptions & { angularVersion: number }) {
    return () =>
      new NgModuleTemplate(
        options.angularVersion,
        options.name,
        options.description,
        options.hidden
      );
  }
}

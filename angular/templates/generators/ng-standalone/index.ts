import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@bitdev/angular.dev-services.common';
import { componentFile } from './files/component';
import { componentSpecFile } from './files/component-spec';
import { componentStylesFile } from './files/component-styles';
import { compositionFile } from './files/composition';
import { docsFile } from './files/docs';
import { publicApiFile } from './files/public-api';

export class NgStandaloneTemplate implements ComponentTemplate {
  private constructor(
    readonly angularVersion: number,
    readonly name = 'ng-standalone',
    readonly description = 'create a standalone Angular component',
    readonly hidden = false
  ) {}

  generateFiles(context: ComponentContext) {
    return [
      publicApiFile(context),
      componentFile(context),
      componentStylesFile(context),
      docsFile(context),
      componentSpecFile(context),
      compositionFile(context),
    ];
  }

  static from(options: AngularComponentTemplateOptions & { angularVersion: number }) {
    return () =>
      new NgStandaloneTemplate(
        options.angularVersion,
        options.name,
        options.description,
        options.hidden
      );
  }
}

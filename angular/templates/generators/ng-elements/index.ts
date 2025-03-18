import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { AngularComponentTemplateOptions } from '@bitdev/angular.dev-services.common';
import { componentFile } from "../ng-standalone/files/component";
import { componentSpecFile } from "../ng-standalone/files/component-spec";
import { componentStylesFile } from "../ng-standalone/files/component-styles";
import { compositionFile } from "../ng-standalone/files/composition";
import { docsFile } from "./files/docs";
import { elementsFile } from './files/ng-elements';

export class NgElementsTemplate implements ComponentTemplate {
  private constructor(
    readonly angularVersion: number,
    readonly name = 'ng-elements',
    readonly description = 'create a custom element using a standalone Angular component',
    readonly hidden = false
  ) {}

  generateFiles(context: ComponentContext) {
    return [
      elementsFile(context),
      componentFile(context),
      componentStylesFile(context),
      docsFile(context),
      componentSpecFile(context),
      compositionFile(context),
    ];
  }

  static from(options: AngularComponentTemplateOptions & { angularVersion: number }) {
    return () =>
      new NgElementsTemplate(
        options.angularVersion,
        options.name,
        options.description,
        options.hidden
      );
  }
}

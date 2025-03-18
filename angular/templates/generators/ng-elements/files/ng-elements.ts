import { ComponentContext, ComponentFile } from '@teambit/generator';

export const elementsFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    isMain: true,
    relativePath: `${name}.ng-elements.ts`,
    content: `/**
 * Entry point for this Angular library, do not move or rename this file.
 * The exports should be a call to ngToCustomElements which returns the list of custom elements selectors.
 */
import { provideExperimentalZonelessChangeDetection } from "@angular/core";
import { ngToCustomElements } from "@bitdev/angular.dev-services.preview.runtime";
import { ${Name}Component as Cmp } from "./${name}.component";

/**
 * Transform a component into a custom element, and returns the selector for this element.
 * It is automatically defined into the custom elements registry when imported.
 * Be aware of the risk of selector collision when defining the components (as the registry is global), so you should
 * try to always use a prefix.
 */
export const ${Name}Component = ngToCustomElements(Cmp, {
  providers: [
    provideExperimentalZonelessChangeDetection()
  ]
});
`,
  };
};

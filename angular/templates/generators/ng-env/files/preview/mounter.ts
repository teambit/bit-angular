export const mounterFile = () => {
  return {
    relativePath: './preview/mounter.ts',
    content: `/* eslint-disable import/no-unresolved */
import { createMounter } from '@bitdev/angular.dev-services.preview.mounter';
import { Component, ViewEncapsulation } from '@angular/core';

/**
 * Provide your component compositions (preview) with the context they need to run.
 * for example, a router, a theme, a data provider, etc.
 * components added here as providers should be listed as host-dependencies in your host-dependencies.ts file.
 * @see https://bit.dev/docs/angular-env/components-preview#compositions-providers
 */
@Component({
  selector: 'bit-wrapper',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  template: \`
    <ng-content></ng-content>
  \`,
}) export class WrapperComponent {}


/**
 * the entry for the app (preview runtime) that renders your component previews.
 * use the default template or create your own.
 * @see https://bit.dev/docs/angular-env/components-preview#compositions-mounter
 */
export default createMounter(WrapperComponent);
`,
  };
};

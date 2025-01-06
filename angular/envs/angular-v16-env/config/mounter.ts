import { createMounter } from '@bitdev/angular.dev-services.preview.mounter';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, ViewEncapsulation } from '@angular/core';

/**
 * Provide your component compositions (preview) with the context they need to run.
 * for example, a router, a theme, a data provider, etc.
 * components added here as providers should be listed as host-dependencies
 * @see https://bit.dev/docs/angular-env-env/components-preview#compositions-providers
 */
@Component({
  selector: 'bit-wrapper',
  // @ts-ignore
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content></ng-content>
  `,
}) export class WrapperComponent {}

/**
 * the entry for the app (preview runtime) that renders your component previews.
 * use the default template or create your own.
 * @see https://bit.dev/docs/angular-env-env/components-preview#compositions-providers
 */
export default createMounter(WrapperComponent);

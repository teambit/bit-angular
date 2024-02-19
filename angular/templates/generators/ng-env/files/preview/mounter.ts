export const mounterFile = (angularVersion: number) => {
  return {
    relativePath: './preview/mounter.ts',
    content: angularVersion <= 13 ? `/* eslint-disable import/no-unresolved */
import { createMounter } from '@bitdev/angular.dev-services.preview.mounter';
import { Component, NgModule, ViewEncapsulation } from '@angular/core';

/**
 * Provide your component compositions (preview) with the context they need to run.
 * for example, a router, a theme, a data provider, etc.
 * components added here as providers should be listed as host-dependencies in your host-dependencies.ts file.
 * @see https://bit.dev/docs/angular-env-env/components-preview#compositions-providers
 */
@Component({
  selector: 'bit-wrapper',
  encapsulation: ViewEncapsulation.ShadowDom,
  template: \`
    <div id='wrapper-host'></div>
  \`,
}) export class WrapperComponent {
}

@NgModule({
  declarations: [WrapperComponent],
  imports: [],
  exports: [WrapperComponent],
  bootstrap: [WrapperComponent],
}) export class WrapperModule {
}


/**
 * the entry for the app (preview runtime) that renders your component previews.
 * use the default template or create your own.
 * @see https://bit.dev/docs/angular-env-env/components-preview#compositions-providers
 */
export default createMounter(WrapperModule, {wrapperSelector: '#wrapper-host'});`
// Angular v14+
: `/* eslint-disable import/no-unresolved */
import { createMounter } from '@bitdev/angular.dev-services.preview.mounter';
import { Component, ViewEncapsulation } from '@angular/core';

/**
 * Provide your component compositions (preview) with the context they need to run.
 * for example, a router, a theme, a data provider, etc.
 * components added here as providers should be listed as host-dependencies in your host-dependencies.ts file.
 * @see https://bit.dev/docs/angular-env-env/components-preview#compositions-providers
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
 * @see https://bit.dev/docs/angular-env-env/components-preview#compositions-providers
 */
export default createMounter(WrapperComponent);
`,
  };
};

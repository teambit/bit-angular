/* eslint-disable */
import 'zone.js';
import { ViewEncapsulation, ɵɵdefineComponent } from '@angular/core';

// The injector used to create custom elements from Angular components
class AppComponent {
  static ɵfac = function AppComponent_Factory(__ngFactoryType__: any) {
    return new (__ngFactoryType__ || AppComponent)();
  };

  static ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({
    type: AppComponent,
    selectors: [["app-root"]],
    decls: 0,
    vars: 0,
    template: function AppComponent_Template(rf, ctx) {
    },
    dependencies: [],
    encapsulation: ViewEncapsulation.None
  });
}

export { AppComponent };

require('zone.js/dist/zone');
const i0 = require('@angular/core') as any;
import { BrowserModule } from '@angular/platform-browser';

// The injector used to create custom elements from Angular components
class AppComponent {
}
// @ts-ignore
AppComponent.ɵfac = function AppComponent_Factory(t) { return new (t || AppComponent)(); };
// @ts-ignore
AppComponent.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: AppComponent, selectors: [["app-root"]], decls: 0, vars: 0, template: function AppComponent_Template(rf, ctx) { }, encapsulation: 2 });
(function () { // @ts-ignore
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AppComponent, [{
  type: i0.Component,
  args: [{
    selector: 'app-root',
    template: ``
  }]
}], null, null); })();
// Module used to load components directly (without any module)
class AppModule {
  ngDoBootstrap() { }
}
// @ts-ignore
AppModule.ɵfac = function AppModule_Factory(t) { return new (t || AppModule)(); };
// @ts-ignore
AppModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: AppModule });
// @ts-ignore
AppModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({ imports: [[BrowserModule]] });
(function () { // @ts-ignore
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AppModule, [{
  type: i0.NgModule,
  args: [{
    imports: [BrowserModule]
  }]
}], null, null); })();
(function () { // @ts-ignore
  (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(AppModule, { imports: [BrowserModule] }); })();

export { AppComponent, AppModule };

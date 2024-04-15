/* eslint-disable */
import 'zone.js';
import { ɵɵdefineComponent, ɵsetClassMetadata, ɵɵdefineNgModule, ɵɵdefineInjector, ɵɵsetNgModuleScope, Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// The injector used to create custom elements from Angular components
class AppComponent {
}
// @ts-ignore
AppComponent.ɵfac = function AppComponent_Factory(t) { return new (t || AppComponent)(); };
// @ts-ignore
AppComponent.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({ type: AppComponent, selectors: [["app-root"]], decls: 0, vars: 0, template: function AppComponent_Template(rf, ctx) { }, encapsulation: 2 });
(function () { // @ts-ignore
  (typeof ngDevMode === "undefined" || ngDevMode) && ɵsetClassMetadata(AppComponent, [{
  type: Component,
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
AppModule.ɵmod = /* @__PURE__ */ ɵɵdefineNgModule({ type: AppModule });
// @ts-ignore
AppModule.ɵinj = /* @__PURE__ */ ɵɵdefineInjector({ imports: [[BrowserModule]] });
(function () { // @ts-ignore
  (typeof ngDevMode === "undefined" || ngDevMode) && ɵsetClassMetadata(AppModule, [{
  type: NgModule,
  args: [{
    imports: [BrowserModule]
  }]
}], null, null); })();
(function () { // @ts-ignore
  (typeof ngJitMode === "undefined" || ngJitMode) && ɵɵsetNgModuleScope(AppModule, { imports: [BrowserModule] }); })();

export { AppComponent, AppModule };

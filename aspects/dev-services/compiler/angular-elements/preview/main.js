import 'zone.js/dist/zone';
import * as i0 from '@angular/core';
import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// The injector used to create custom elements from Angular components
class AppComponent {
}
AppComponent.ɵfac = function AppComponent_Factory(t) { return new (t || AppComponent)(); };
AppComponent.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: AppComponent, selectors: [["app-root"]], decls: 0, vars: 0, template: function AppComponent_Template(rf, ctx) { }, encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AppComponent, [{
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
AppModule.ɵfac = function AppModule_Factory(t) { return new (t || AppModule)(); };
AppModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: AppModule });
AppModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({ imports: [[BrowserModule]] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AppModule, [{
  type: NgModule,
  args: [{
    imports: [BrowserModule]
  }]
}], null, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(AppModule, { imports: [BrowserModule] }); })();

export { AppComponent, AppModule };

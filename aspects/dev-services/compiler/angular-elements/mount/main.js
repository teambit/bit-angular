import 'zone.js/dist/zone';
import * as i0 from '@angular/core';
import { Component, NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule, platformBrowser } from '@angular/platform-browser';

// The injector used to create custom elements from Angular components
let counter = 0;
const DEFINED_ELEMENTS = new Map();
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
// Bootstrap the AppModule
function bootstrap(module) {
  return platformBrowser()
    .bootstrapModule(module);
}
function maybeUnwrapFn(value) {
  return value instanceof Function ? value() : value;
}
async function insertComponent(components, parentModule) {
  const selectors = [];
  const ngModuleRef = await bootstrap(parentModule || AppModule);
  // @ts-ignore
  const rootInjector = ngModuleRef.get(Injector);
  components.forEach((component) => {
    const definedSelector = DEFINED_ELEMENTS.get(component);
    // That component has already been defined as a custom element
    if (definedSelector) {
      selectors.push(definedSelector);
    }
    else {
      let selector = Reflect.get(component, 'ɵcmp').selectors[0][0];
      // check if that selector is already used
      if (customElements.get(selector)) {
        selector = `${selector}_${++counter}`;
      }
      const custom = createCustomElement(component, { injector: rootInjector });
      customElements.define(selector, custom);
      DEFINED_ELEMENTS.set(component, selector);
      selectors.push(selector);
    }
  });
  return selectors;
}
async function insertModule(module) {
  const moduleProps = Reflect.get(module, 'ɵmod');
  if (!moduleProps) {
    // we are using view engine & JIT
    throw new Error('View engine is not supported for compositions, please use ivy');
  }
  const componentsToLoad = maybeUnwrapFn(moduleProps._bootstrap ? moduleProps._bootstrap : moduleProps.bootstrap);
  if(!moduleProps._bootstrap) {
    moduleProps._bootstrap = moduleProps.bootstrap;
  }
  moduleProps.bootstrap = [];
  if(!module.prototype.ngDoBootstrap) {
    module.prototype.ngDoBootstrap = AppModule.prototype.ngDoBootstrap;
  }
  if (!moduleProps.imports.includes(BrowserModule)) {
    console.warn(`Automatically injecting "BrowserModule" into your composition for retro-compatibility, please add it to the imports of your module "${module.name}"`);
    const moduleInjector = Reflect.get(module, 'ɵinj');
    moduleInjector.imports[0].push(...AppModule.ɵinj.imports[0]);
  }
  // we are using ivy & AOT
  return insertComponent(componentsToLoad, module);
}
async function loadAngularElement(moduleOrComponent) {
  if (Reflect.get(moduleOrComponent, 'ɵcmp')) {
    return insertComponent([moduleOrComponent]);
  }
  else if (Reflect.get(moduleOrComponent, 'ɵmod') || Reflect.get(moduleOrComponent, 'ngInjectorDef')) {
    return insertModule(moduleOrComponent);
  }
  // We couldn't figure out the type of the exports from the composition
  throw new Error(`Unknown type of composition for ${moduleOrComponent}, the Angular aspect only supports modules or components`);
}

export { loadAngularElement };
//# sourceMappingURL=main.js.map

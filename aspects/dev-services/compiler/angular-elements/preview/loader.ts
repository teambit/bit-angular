import { Injector, NgModuleRef, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import '@angular/compiler';
import './native-shim.js';
import 'zone.js/dist/zone';
import { AppModule } from './main';

let counter = 0;
const DEFINED_ELEMENTS = new Map();

// Bootstrap the AppModule
function bootstrap(module: Type<any>): Promise<NgModuleRef<any>> {
  return platformBrowserDynamic()
    .bootstrapModule(module);
}

function maybeUnwrapFn<T>(value: T | (() => T)): T {
  return value instanceof Function ? value() : value;
}

async function loadComponents<C, M>(components: Type<C>[], parentModule?: Type<M>): Promise<string[]> {
  const selectors: string[] = [];
  const ngModuleRef = await bootstrap(parentModule || AppModule);
  // @ts-ignore
  const rootInjector = ngModuleRef.get(Injector);
  components.forEach((component) => {
    const definedSelector = DEFINED_ELEMENTS.get(component);
    // That component has already been defined as a custom element
    if (definedSelector) {
      selectors.push(definedSelector);
    } else {
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

async function getModuleComponents<M>(module: Type<M>): Promise<Type<any>[]> {
  const moduleProps = Reflect.get(module, 'ɵmod');
  if (!moduleProps) {
    // we are using view engine & JIT
    throw new Error('View engine is not supported for compositions, please use ivy');
  }
  const componentsToLoad: Type<any>[] = maybeUnwrapFn(moduleProps._bootstrap ? moduleProps._bootstrap : moduleProps.bootstrap);
  if (!moduleProps._bootstrap) {
    moduleProps._bootstrap = moduleProps.bootstrap;
  }
  moduleProps.bootstrap = [];
  if (!module.prototype.ngDoBootstrap) {
    module.prototype.ngDoBootstrap = AppModule.prototype.ngDoBootstrap;
  }
  if (!moduleProps.imports.includes(BrowserModule)) {
    // eslint-disable-next-line no-console
    console.warn(`Automatically injecting "BrowserModule" into your composition for retro-compatibility, please add it to the imports of your module "${module.name}"`);
    const moduleInjector = Reflect.get(module, 'ɵinj');
    const { imports } = AppModule.ɵinj as { imports: any[] };
    moduleInjector.imports[0].push(...imports[0]);
  }
  // we are using ivy & AOT
  return componentsToLoad;
}

async function loadAngularElement(moduleOrComponents: Type<any>[]): Promise<string[]> {
  const componentsToLoad: Type<any>[] = [];
  let parentModule: Type<any> | undefined;
  for (let i = 0; i < moduleOrComponents.length; i++) {
    const moduleOrComponent = moduleOrComponents[i];
    if (Reflect.get(moduleOrComponent, 'ɵcmp')) {
      componentsToLoad.push(moduleOrComponent);
    } else if (Reflect.get(moduleOrComponent, 'ɵmod') || Reflect.get(moduleOrComponent, 'ngInjectorDef')) {
      componentsToLoad.push(...await getModuleComponents(moduleOrComponent));
      parentModule = moduleOrComponent;
    } else {
      // We couldn't figure out the type of the exports from the composition
      console.error(`Unknown type of composition for ${moduleOrComponent.name || moduleOrComponent}, the Angular env can only load modules or components`);
    }
  }
  if (componentsToLoad.length) {
    // parentModule is only passed if there is just one component to load, otherwise it is undefined to use default App
    return loadComponents(componentsToLoad, componentsToLoad.length === 1 ? parentModule : undefined);
  } else {
    throw new Error('Unable to load any composition, the Angular env can only load modules or components');
  }
}

export { loadAngularElement };

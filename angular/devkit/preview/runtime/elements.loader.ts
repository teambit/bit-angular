/// <reference types="vite/client" />
import { Injector, type Type, type ApplicationConfig, ɵresetCompiledComponents } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { getCmpSelector, getComponentsToLoad } from "./util.js";

const DEFINED_ELEMENTS = new Map();

function createCustomElements<C>(components: Type<C>[], rootInjectorPromise: Promise<Injector>): string[] {
  const selectors: string[] = [];
  components.forEach((component) => {
    const definedSelector = DEFINED_ELEMENTS.get(component);
    // That component has already been defined as a custom element
    if (definedSelector) {
      selectors.push(definedSelector);
    } else {
      let selector = getCmpSelector(component);
      // check if that selector is already used
      if (customElements.get(selector)) {
        const newSelector = `${selector}_${Date.now()}`;
        // @ts-ignore
        if ((import.meta.hot || (typeof module !== 'undefined' && (module as any).hot))) {
          // eslint-disable-next-line no-console
          console.debug(`[hmr] generating new selector to register the updated custom element, using "${newSelector}" instead of "${selector}"`);
        }
        selector = newSelector;
      }
      void rootInjectorPromise.then((rootInjector) => {
        // Reset the compiled components to avoid error "NG0912: Component ID generation collision detected"
        ɵresetCompiledComponents();
        const custom = createCustomElement(component, { injector: rootInjector });
        customElements.define(selector, custom);
      });
      DEFINED_ELEMENTS.set(component, selector);
      selectors.push(selector);
    }
  });
  return selectors;
}

async function getRootInjector(applicationConfig?: ApplicationConfig): Promise<Injector> {
  const appRef = await createApplication(applicationConfig);
  return appRef.injector;
}

declare global {
  interface Window {
    rootInjector: Promise<Injector> | undefined;
  }
}

/**
 * Loads the given Angular modules/components as custom elements and returns their selectors.
 * For modules, it returns the selectors of the components that are in the "bootstrap" property.
 */
export function ngToCustomElements(modulesOrComponents: Type<any>, applicationConfig?: ApplicationConfig): string;
export function ngToCustomElements(modulesOrComponents: Type<any>[], applicationConfig?: ApplicationConfig): string[];
export function ngToCustomElements(modulesOrComponents: Type<any>[] | Type<any>, applicationConfig?: ApplicationConfig): string[] | string {
  const isArray = Array.isArray(modulesOrComponents);
  const { componentsToLoad } = getComponentsToLoad(isArray ? modulesOrComponents : [modulesOrComponents]);
  if (componentsToLoad.length) {
    // we are reusing the same rootInjector for all the custom elements, and also when HMR is enabled
    window.rootInjector = window.rootInjector || getRootInjector(applicationConfig);
    const customElements = createCustomElements(componentsToLoad, window.rootInjector);
    return isArray ? customElements : customElements[0];
  }
  throw new Error('Unable to load any composition, the Angular env can only load modules or components');
}

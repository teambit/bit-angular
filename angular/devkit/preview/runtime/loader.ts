/* eslint-disable */
// @ts-ignore
import './native-shim.cjs';
import { Injector, NgModuleRef, Type, ɵɵdefineInjector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import type { ApplicationRef } from '@angular/core';
import type { ApplicationConfig } from '@angular/platform-browser';
import { bootstrapApplication } from "@angular/platform-browser";
import { createComponent, NgZone, StaticProvider } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import assert from "assert";

const enum RenderStrategy {
  Elements = 'element',
  Standalone = 'standalone'
}

let counter = 0;
const DEFINED_ELEMENTS = new Map();
let appRef: NgModuleRef<any> | ApplicationRef | null = null;

// Bootstrap the main component/module
async function bootstrap(moduleOrComponent?: Type<any>, renderStrategy?: RenderStrategy, applicationConfig?: ApplicationConfig): Promise<NgModuleRef<any> | ApplicationRef> {
  if (appRef) {
    // @ts-ignore
    appRef.destroy();
    appRef = null;
  }
  if (renderStrategy === RenderStrategy.Elements || !moduleOrComponent) {
    appRef = await createApplication(applicationConfig);
  } else if (renderStrategy === RenderStrategy.Standalone) {
    // @ts-ignore
    appRef = await bootstrapApplication(moduleOrComponent, applicationConfig);
  } else {
    appRef = await platformBrowserDynamic().bootstrapModule(moduleOrComponent, { providers: applicationConfig?.providers as StaticProvider[] });
  }
  return appRef!;
}

function maybeUnwrapFn<T>(value: T | (() => T)): T {
  return value instanceof Function ? value() : value;
}

function getCmpSelector<C>(component: Type<C>): string {
  return Reflect.get(component, 'ɵcmp').selectors[0][0];
}

function createCustomElements<C>(components: Type<C>[], rootInjector: Injector): string[] {
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
  if (!moduleProps.imports.some((module: Type<any>) => module.prototype.constructor.name === 'BrowserModule')) {
    const moduleInjector = Reflect.get(module, 'ɵinj');
    const { imports } = ɵɵdefineInjector({ imports: [[BrowserModule]] }) as { imports: any[] };
    moduleInjector.imports.push(...imports[0]);
  }
  // we are using ivy & AOT
  return componentsToLoad;
}

async function getComponentsToLoad<C>(modulesOrComponents: Type<any>[]): Promise<{
  componentsToLoad: Type<C>[],
  parentModule?: Type<any>
}> {
  const componentsToLoad: Type<any>[] = [];
  let parentModule: Type<any> | undefined;
  for (let i = 0; i < modulesOrComponents.length; i++) {
    const moduleOrComponent = modulesOrComponents[i];
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
  return { componentsToLoad, parentModule };
}

/**
 * Loads the given Angular modules/components as custom elements and returns their selectors.
 * For modules, it returns the selectors of the components that are in the "bootstrap" property.
 */
export async function ngToCustomElements(modulesOrComponents: Type<any>, applicationConfig?: ApplicationConfig): Promise<string>;
export async function ngToCustomElements(modulesOrComponents: Type<any>[], applicationConfig?: ApplicationConfig): Promise<string[]>;
export async function ngToCustomElements(modulesOrComponents: Type<any>[] | Type<any>, applicationConfig?: ApplicationConfig): Promise<string[] | string> {
  const isArray = Array.isArray(modulesOrComponents);
  const { componentsToLoad } = await getComponentsToLoad(isArray ? modulesOrComponents : [modulesOrComponents]);
  if (componentsToLoad.length) {
    const emptyAppRef = await bootstrap(undefined, RenderStrategy.Elements, applicationConfig) as ApplicationRef;
    const rootInjector = emptyAppRef.injector;
    // We remove the reference to appRef to avoid destroying it, because for angular elements we keep the custom
    // elements detached from the DOM when we unmount them. We need to keep the appRef alive to be able to reattach.
    appRef = null;
    const customElements = createCustomElements(componentsToLoad, rootInjector);
    return isArray ? customElements : customElements[0];
  }
  throw new Error('Unable to load any composition, the Angular env can only load modules or components');
}

export interface NgBootstrapOptions {
  // Element where the compositions will be mounted in the index.html file.
  hostElement: Element;
  // Component to use as a wrapper for the compositions.
  wrapper?: Type<any>;
  /**
   * Set of config options available during the application bootstrap operation, such as providers.
   * See https://angular.io/api/platform-browser/ApplicationConfig
   */
  appConfig?: ApplicationConfig;
}

function replaceDomElements(hostElement: Element | ShadowRoot, selectors: string[]): Element[] {
  const cmpElements: Element[] = selectors.map(selector => document.createElement(selector));
  hostElement.replaceChildren(...cmpElements);
  return cmpElements;
}

export async function ngBootstrap<C>(modulesOrComponents: Type<any> | Type<any>[], options: NgBootstrapOptions): Promise<NgModuleRef<C> | ApplicationRef | null> {
  if (!Array.isArray(modulesOrComponents)) {
    modulesOrComponents = [modulesOrComponents];
  }

  // check for angular standalone support
  assert(typeof bootstrapApplication === 'function', 'Standalone components support is required, please update to Angular v15 or above');
  let {
    componentsToLoad,
    parentModule
  } = await getComponentsToLoad(modulesOrComponents);
  if (componentsToLoad.length) {
    if (options.wrapper) {
      return wrapComponent(options.hostElement, options.wrapper, componentsToLoad, options.appConfig);
    }
    const selectors: string[] = [];
    componentsToLoad.forEach((component: Type<any>) => {
      const selector = getCmpSelector(component);
      selectors.push(selector);
    });

    replaceDomElements(options.hostElement, selectors);

    if (componentsToLoad.length === 1 && !parentModule) {
      // We are loading a standalone component
      parentModule = componentsToLoad[0];
      const componentProps = Reflect.get(parentModule, 'ɵcmp');
      componentProps.standalone = true;
      return bootstrap(parentModule, RenderStrategy.Standalone, options.appConfig);
    }

    // We are loading a module or multiple components
    if (!parentModule) {
      const { AppComponent } = await import('./main.js');
      parentModule = AppComponent;
    }
    return bootstrap(parentModule, undefined, options.appConfig);
  }
  throw new Error('Unable to load any composition, the Angular env can only load modules or components');
}

async function wrapComponent(hostElement: Element, wrapperComponent: Type<any>, childComponents: Type<any>[], applicationConfig?: ApplicationConfig): Promise<ApplicationRef> {
  if (appRef) {
    // @ts-ignore
    appRef.destroy();
    appRef = null;
  }
  const lazyAppRef = await createApplication(applicationConfig);
  const zone = lazyAppRef.injector.get(NgZone);
  // We cannot use the hostElement directly to attach the wrapper component to the DOM because
  // `appRef.destroy()` will remove it from the DOM, that's why we create a wrapper element
  const wrapperElement = document.createElement('wrapper');
  hostElement.replaceChildren(wrapperElement);

  zone.run(() => {
    const childCmpRefs = childComponents.map(child => {
      return createComponent(child, {
        environmentInjector: lazyAppRef.injector
      });
    });
    const cmpRef = createComponent(wrapperComponent, {
      environmentInjector: lazyAppRef.injector,
      hostElement: wrapperElement,
      projectableNodes: [
        // ng-content nodes
        [...childCmpRefs.map(cmpRef => cmpRef.location.nativeElement)]
      ]
    });

    // Attach host views to the application so that they are dirty checked
    lazyAppRef.attachView(cmpRef.hostView);
    childCmpRefs.forEach(child => lazyAppRef.attachView(child.hostView));
  });
  return lazyAppRef;
}

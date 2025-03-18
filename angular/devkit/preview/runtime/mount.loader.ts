/* eslint-disable */
import type { ApplicationRef } from '@angular/core';
import { NgModuleRef, Type } from '@angular/core';
import type { ApplicationConfig } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { bootstrap, getCmpSelector, getComponentsToLoad, RenderStrategy, wrapComponent } from './util.js';

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
  if (typeof bootstrapApplication !== 'function') {
    throw new Error('Standalone components support is required, please update to Angular v15 or above');
  }
  let {
    componentsToLoad,
    parentModule
  } = getComponentsToLoad(modulesOrComponents);
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

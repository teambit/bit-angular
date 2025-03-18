/* eslint-disable */
import {loadShim} from './native-shim.cjs';
import type { ApplicationRef } from '@angular/core';
import { createComponent, type NgModuleRef, NgZone, type StaticProvider, type Type, ɵɵdefineInjector } from '@angular/core';
import type { ApplicationConfig } from '@angular/platform-browser';
import { bootstrapApplication, BrowserModule, createApplication } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

loadShim();

export const enum RenderStrategy {
  Elements = 'element',
  Standalone = 'standalone'
}

let appRef: NgModuleRef<any> | ApplicationRef | null = null;

export function setAppRef(ref: NgModuleRef<any> | ApplicationRef | null) {
  appRef = ref;
}

// Bootstrap the main component/module
export async function bootstrap(moduleOrComponent?: Type<any>, renderStrategy?: RenderStrategy, applicationConfig?: ApplicationConfig): Promise<NgModuleRef<any> | ApplicationRef> {
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

export function getCmpSelector<C>(component: Type<C>): string {
  return Reflect.get(component, 'ɵcmp').selectors[0][0];
}

function getModuleComponents<M>(module: Type<M>): Type<any>[] {
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

export function getComponentsToLoad<C>(modulesOrComponents: Type<any>[]): {
  componentsToLoad: Type<C>[],
  parentModule?: Type<any>
} {
  const componentsToLoad: Type<any>[] = [];
  let parentModule: Type<any> | undefined;
  for (let i = 0; i < modulesOrComponents.length; i++) {
    const moduleOrComponent = modulesOrComponents[i];
    if (Reflect.get(moduleOrComponent, 'ɵcmp')) {
      componentsToLoad.push(moduleOrComponent);
    } else if (Reflect.get(moduleOrComponent, 'ɵmod') || Reflect.get(moduleOrComponent, 'ngInjectorDef')) {
      componentsToLoad.push(...getModuleComponents(moduleOrComponent));
      parentModule = moduleOrComponent;
    } else {
      // We couldn't figure out the type of the exports from the composition
      console.error(`Unknown type of composition for ${moduleOrComponent.name || moduleOrComponent}, the Angular env can only load modules or components`);
    }
  }
  return { componentsToLoad, parentModule };
}

export async function wrapComponent(hostElement: Element, wrapperComponent: Type<any>, childComponents: Type<any>[], applicationConfig?: ApplicationConfig): Promise<ApplicationRef> {
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

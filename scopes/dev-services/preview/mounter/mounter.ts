// required here to make sure that this is loaded before the compositions file
import '@angular/compiler';
import { Type } from '@angular/core';
import { ngBootstrap, NgBootstrapOptions } from '@teambit/angular-runtime';

export interface MounterOptions extends Omit<NgBootstrapOptions, "wrapper"| "hostElement"> {
  hostElement?: HTMLElement;
}

export function createMounter<C>(WrapperCmp?: Type<C>, options: MounterOptions = {}) {
  return async (Composition: Type<any>) => {
    const root = options.hostElement ?? document.getElementById('root');
    if (!root) {
      throw new Error('Host element not found, please provide an `hostElement` or add an element with id "root" to the DOM');
    }
    await ngBootstrap(Composition, {
      ...options,
      hostElement: root,
      wrapper: WrapperCmp,
    });
  };
}

export default createMounter;
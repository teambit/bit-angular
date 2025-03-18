import type { JSX } from 'react';
import { type Type } from '@angular/core';
import { ngToCustomElements } from './elements.loader.js';

/**
 * Creates React components from a list of custom element selectors
 */
export function customElementsToReact(Selectors: string): JSX.Element;
export function customElementsToReact(Selectors: string[]): JSX.Element[];
export function customElementsToReact(Selectors: string[] | string): JSX.Element[] | JSX.Element {
  const isArray = Array.isArray(Selectors);
  return isArray ? Selectors.map((Selector: string) => {
    return (<Selector key={Selector}/>);
  }) : (<Selectors key={Selectors}/>);
}

/**
 * Loads the given Angular modules/components as custom elements and returns them as React components.
 * For modules, it creates a new React component for each Angular component that is in the "bootstrap" property.
 */
export async function ngToReact(modulesOrComponents: Type<any>): Promise<JSX.Element>;
export async function ngToReact(modulesOrComponents: Type<any>[]): Promise<JSX.Element[]>;
export async function ngToReact(modulesOrComponents: Type<any>[] | Type<any>): Promise<JSX.Element[] | JSX.Element> {
  const customElements = await ngToCustomElements(modulesOrComponents as Type<any>);
  return customElementsToReact(customElements) as JSX.Element[] | JSX.Element;
}

import React from 'react';
import { Type } from '@angular/core';
import { ngToCustomElements } from './loader';

/**
 * Creates React components from a list of custom element selectors
 */
export function customElementsToReact(selectors: string[]): React.ComponentType<any>[] {
  return selectors.map((Selector: string) => {
    return () => {
      return <Selector key={Selector} />;
    };
  });
}

/**
 * Loads the given Angular modules/components as custom elements and returns them as React components.
 * For modules, it creates a new React component for each Angular component that is in the "bootstrap" property.
 */
export async function ngToReact(modulesOrComponents: Type<any>[]): Promise<React.ComponentType[]> {
  return customElementsToReact(await ngToCustomElements(modulesOrComponents));
}

import { Type } from '@angular/core';
import { RenderingContext } from '@teambit/preview';
import DocsRoot from '@teambit/react.ui.docs-app';
import React from 'react';
import { loadAngularElement } from './loader';

/**
 * This mounts Angular compositions into the React DOM in the component preview.
 */
export default async (
    Provider: React.ComponentType | undefined,
    componentId: string,
    docs: any,
    compositionsMap: { [key: string]: any },
    _context: RenderingContext
): Promise<void> => {
  const keys: string[] = Object.keys(compositionsMap);
  const compositions: Type<any>[] = Object.values(compositionsMap);
  const selectors = await loadAngularElement(compositions);
  const reactComponents: { [key: string]: any } = {};
  selectors.map((Selector: string, index: number) => {
    reactComponents[keys[index]] = () => {
      return <Selector key={Selector}></Selector>;
    };
  });

  DocsRoot(Provider, componentId, docs, reactComponents, _context);
};

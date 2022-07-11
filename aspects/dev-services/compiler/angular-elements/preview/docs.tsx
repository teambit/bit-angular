import { Type } from '@angular/core';
import { RenderingContext } from '@teambit/preview';
import DocsRoot from '@teambit/react.ui.docs-app';
import React from 'react';
import { ngToReact } from './loader';

export type DocsRootProps = {
  Provider: Type<any> | undefined,
  componentId: string,
  docs: any,
  compositions: { [key: string]: any },
  context: RenderingContext
}

/**
 * This mounts Angular compositions into the React DOM for the component preview.
 */
async function docsRoot({docs, componentId, compositions: ngCompositions, context, Provider}: DocsRootProps): Promise<void> {
  const keys: string[] = Object.keys(ngCompositions);
  const reactComponents = await ngToReact(Object.values(ngCompositions));

  const compositions: { [key: string]: any } = {};
  reactComponents.forEach((component: any, index: number) => {
    compositions[keys[index]] = component;
  });

  // undefined, componentId, docs, reactComponents, context
  DocsRoot({Provider, componentId, docs, compositions, context});
}

// Add support for new api signature
// TODO: remove by the end of 2022
docsRoot.apiObject = true;

export default docsRoot;

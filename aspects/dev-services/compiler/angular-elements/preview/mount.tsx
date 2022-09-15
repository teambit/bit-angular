import React from 'react';
import ReactDOM from 'react-dom';
import { ngToCustomElements } from '@teambit/angular-elements-loader';

const root = document.getElementById('root') as HTMLElement;

/**
 * this mounts compositions into the DOM in the component preview.
 * this function can be overridden through ReactAspect.overrideCompositionsMounter() API
 * to apply custom logic for component DOM mounting.
 */
export default async (composition: any/*, previewContext: RenderingContext*/) => {
  const selectors = await ngToCustomElements([composition]);
  ReactDOM.render(
    <div>{selectors.map(Selector => <Selector key={Selector}></Selector>)}</div>,
    root
  );
};

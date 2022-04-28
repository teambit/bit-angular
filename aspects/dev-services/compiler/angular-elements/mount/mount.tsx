import React from 'react';
import ReactDOM from 'react-dom';
// import { RenderingContext } from '@teambit/preview';

import {loadAngularElement} from './main';

const root = document.getElementById('root') as HTMLElement;

/**
 * this mounts compositions into the DOM in the component preview.
 * this function can be overridden through ReactAspect.overrideCompositionsMounter() API
 * to apply custom logic for component DOM mounting.
 */
export default async (composition: any/*, previewContext: RenderingContext*/) => {
  const selectors = await loadAngularElement(composition);
  ReactDOM.render(
    <div>{selectors.map(Selector => <Selector key={Selector}></Selector>)}</div>,
    root
  );
};

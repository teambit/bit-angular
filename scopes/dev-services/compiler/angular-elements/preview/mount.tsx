import React from 'react';
import ReactDOM from 'react-dom';
// required here to make sure that this is loaded before the compositions file
import '@angular/compiler';
import { ngToReact } from '@teambit/angular-runtime';

const root = document.getElementById('root') as HTMLElement;

/**
 * this mounts compositions into the DOM in the component preview.
 * this function can be overridden through ReactAspect.overrideCompositionsMounter() API
 * to apply custom logic for component DOM mounting.
 */
export default async (composition: any/* , previewContext: RenderingContext */) => {
  ReactDOM.render(
    <div>{await ngToReact([composition])}</div>,
    root
  );
};

/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';
// required here to make sure that this is loaded before the compositions file
// import '@angular/compiler';
import { ngToReact } from '@bitdev/angular.dev-services.preview.runtime';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container!);

/**
 * this mounts compositions into the DOM in the component preview.
 * this function can be overridden through ReactAspect.overrideCompositionsMounter() API
 * to apply custom logic for component DOM mounting.
 */
export default async (composition: any/* , previewContext: RenderingContext */) => {
  root.render(<div>{await ngToReact(composition)}</div>);
};

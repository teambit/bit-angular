import type { RenderingContext } from '@teambit/preview';
// @ts-ignore
import type { Type } from '@angular/core';
import { ReplaySubject } from 'rxjs';

window.onDocsLoad$ = window.onDocsLoad$ || new ReplaySubject<string>();
const root = document.getElementById('root');

export type DocsFile = {
  default: string;
};

export type DocsRootProps = {
  Provider: Type<any> | undefined,
  componentId: string,
  docs: DocsFile | string | undefined,
  compositions: { [key: string]: any },
  context: RenderingContext
}

async function docsRoot({docs}: DocsRootProps): Promise<void> {
  if (docs && root) {
    const appRoot = document.createElement('app-root');
    root.replaceChildren(appRoot);
    await window.ngMainStart();
    window.onDocsLoad$.next((docs as DocsFile).default ?? docs as string);
  }
}

// Add support for new api signature
// TODO: remove by the end of 2022
docsRoot.apiObject = true;

export default docsRoot;

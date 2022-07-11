import { RenderingContext } from '@teambit/preview';
import { Type } from '@angular/core';
import { ReplaySubject } from 'rxjs';


window.onDocsLoad$ = window.onDocsLoad$ || new ReplaySubject<string>();

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
  if (docs) {
    window.onDocsLoad$.next((docs as DocsFile).default ?? docs);
  }
}

// Add support for new api signature
// TODO: remove by the end of 2022
docsRoot.apiObject = true;

export default docsRoot;

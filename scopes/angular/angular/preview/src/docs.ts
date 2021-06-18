import { RenderingContext } from '@teambit/preview';
import { Type } from '@angular/core';
// import { AngularAspect } from '../../angular.aspect';
import { ReplaySubject } from 'rxjs';
import { DocsFile } from '../../docs/types';

window.onDocsLoad$ = window.onDocsLoad$ || new ReplaySubject<any>();

export default function docsRoot(
  Provider: Type<any> | undefined,
  componentId: string,
  docs: DocsFile | undefined,
  compositionsMap: { [name: string]: Type<any> },
  context: RenderingContext
) {
  // const angularRenderingContext = context.get(AngularAspect.id);
  if (docs) {
    window.onDocsLoad$.next(docs.default);
  }
}

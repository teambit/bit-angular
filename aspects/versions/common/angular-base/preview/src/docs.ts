import { RenderingContext } from '@teambit/preview';
import { Type } from '@angular/core';
import { ReplaySubject } from 'rxjs';

export type DocsFile = {
  default: string;
};

window.onDocsLoad$ = window.onDocsLoad$ || new ReplaySubject<string>();


export default async function docsRoot(
  _provider: Type<any> | undefined,
  componentId: string,
  docs: DocsFile | string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _compositionsMap: { [name: string]: Type<any> },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: RenderingContext
) {
  console.log('base docs root');
  // const angularRenderingContext = context.get(AngularAspect.id);
  // const component = await getComponentData(componentId);
  if (docs) {
    window.onDocsLoad$.next((docs as any).default ?? docs);
  }
}

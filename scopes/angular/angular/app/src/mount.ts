import { ReplaySubject } from 'rxjs';

window.onComponentLoad$ = window.onComponentLoad$ || new ReplaySubject<any>();
window.onModuleLoad$ = window.onModuleLoad$ || new ReplaySubject<any>();

/**
 * this mounts compositions into the DOM in the component preview.
 * this function can be overridden through ReactAspect.overrideCompositionsMounter() API
 * to apply custom logic for component DOM mounting.
 */
export default (composition: any, previewContext: any) => {
  if(Reflect.get(composition, 'ɵcmp')) {
    window.onComponentLoad$.next(composition);
  } else if(Reflect.get(composition, 'ɵmod')) {
    window.onModuleLoad$.next(composition);
  } else {
    console.info(`Unknown type of composition for ${composition}, the Angular aspect only supports components and modules`);
  }
};

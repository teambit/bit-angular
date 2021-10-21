import { ReplaySubject } from 'rxjs';
// import { RenderingContext } from '@teambit/preview';

window.onComponentLoad$ = window.onComponentLoad$ || new ReplaySubject<any>();
window.onModuleLoad$ = window.onModuleLoad$ || new ReplaySubject<any>();

/**
 * this mounts compositions into the DOM in the component preview.
 * this function can be overridden through AngularAspect.overrideCompositionsMounter() API
 * to apply custom logic for component DOM mounting.
 */
export default (composition: any/*, previewContext: RenderingContext*/) => {
  if (Reflect.get(composition, 'ɵcmp')) {
    window.onComponentLoad$.next(composition);
  } else if (Reflect.get(composition, 'ɵmod') || Reflect.get(composition, 'ngInjectorDef')) {
    window.onModuleLoad$.next(composition);
  } else {
    console.info(
      `Unknown type of composition for ${composition}, the Angular aspect only supports modules or components (for v9+)`
    );
  }
};

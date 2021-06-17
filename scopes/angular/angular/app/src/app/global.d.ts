import { ReplaySubject } from 'rxjs';

declare global {
  interface Window {
    onComponentLoad$: ReplaySubject<any>;
    onModuleLoad$: ReplaySubject<any>;
  }
}

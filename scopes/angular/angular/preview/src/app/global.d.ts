import { Type } from '@angular/core';
import { ReplaySubject } from 'rxjs';

declare global {
  interface Window {
    onComponentLoad$: ReplaySubject<Type<any>>;
    onModuleLoad$: ReplaySubject<Type<any>>;
    onDocsLoad$: ReplaySubject<string>;
  }
}

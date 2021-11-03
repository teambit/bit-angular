import { Type } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DocsTemplateAttrs } from '../types';

declare global {
  interface Window {
    onComponentLoad$: ReplaySubject<Type<any>>;
    onModuleLoad$: ReplaySubject<Type<any>>;
    onDocsLoad$: ReplaySubject<DocsTemplateAttrs>;
  }
}

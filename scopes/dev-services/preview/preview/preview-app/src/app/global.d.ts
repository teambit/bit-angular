import { NgModuleRef } from '@angular/core';
import { ReplaySubject } from 'rxjs';

declare global {
  interface Window {
    onDocsLoad$: ReplaySubject<string>;
    ngMainStart: () => Promise<NgModuleRef<any> | void>;
  }
}

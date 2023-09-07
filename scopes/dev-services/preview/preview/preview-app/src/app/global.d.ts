import type { NgModuleRef } from '@angular/core';
import type { ReplaySubject } from 'rxjs';

declare global {
  interface Window {
    onDocsLoad$: ReplaySubject<string>;
    ngMainStart: () => Promise<NgModuleRef<any> | void>;
  }
}

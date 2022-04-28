import { Injector } from '@angular/core';

declare global {
  interface Window {
    $injector: Injector
  }
}

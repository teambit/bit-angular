import { Directive, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[lazyLoad]' })
export class LazyLoadDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}

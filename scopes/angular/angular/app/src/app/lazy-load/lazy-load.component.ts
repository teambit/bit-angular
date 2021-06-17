import {
  Component,
  ComponentFactoryResolver,
  Injector,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ɵNgModuleDef,
  ChangeDetectorRef
} from '@angular/core';
import { LazyLoadDirective } from './lazy-load.directive';

@Component({
  selector: 'app-lazy-load',
  template: `
    <ng-template lazyLoad></ng-template>
  `
})
export class LazyLoadComponent implements OnInit, OnDestroy {
  @ViewChild(LazyLoadDirective, { static: true }) lazyLoad!: LazyLoadDirective;
  constructor(private cfr: ComponentFactoryResolver, private injector: Injector, private cdr: ChangeDetectorRef) {}

  /**
   * Unwrap a value which might be behind a closure (for forward declaration reasons).
   */
  private maybeUnwrapFn<T>(value: T|(() => T)): T {
    return value instanceof Function ? value() : value;
  }

  private insertComponent(components: Type<any>[]) {
    this.lazyLoad.viewContainerRef.clear();
    components.forEach(component => {
      const componentFactory = this.cfr.resolveComponentFactory(component);
      this.lazyLoad.viewContainerRef.createComponent(componentFactory);
    });
    this.cdr.detectChanges();
  }

  private insertModule(module: Type<any>) {
    const moduleProps = Reflect.get(module, 'ɵmod') as ɵNgModuleDef<any>;
    this.insertComponent(this.maybeUnwrapFn(moduleProps.bootstrap))
  }

  ngOnInit(): void {
    window.onComponentLoad$.subscribe(component => this.insertComponent([component]));
    window.onModuleLoad$.subscribe(module => this.insertModule(module));
  }

  ngOnDestroy(): void {
    window.onComponentLoad$.unsubscribe();
    window.onModuleLoad$.unsubscribe();
  }
}

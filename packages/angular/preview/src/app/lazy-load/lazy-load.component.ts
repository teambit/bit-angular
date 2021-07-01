import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Injector,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ɵNgModuleDef,
} from '@angular/core';
import { DocsComponent } from '../docs/docs.component';
import { LazyLoadDirective } from './lazy-load.directive';

@Component({
  selector: 'app-lazy-load',
  template: ` <ng-template lazyLoad></ng-template> `,
})
export class LazyLoadComponent implements OnInit, OnDestroy {
  @ViewChild(LazyLoadDirective, { static: true }) lazyLoad!: LazyLoadDirective;

  constructor(private cfr: ComponentFactoryResolver, private injector: Injector, private cdr: ChangeDetectorRef) {}

  /**
   * Unwrap a value which might be behind a closure (for forward declaration reasons).
   */
  private maybeUnwrapFn<T>(value: T | (() => T)): T {
    return value instanceof Function ? value() : value;
  }

  private insertComponent(components: Type<any>[]): ComponentRef<any>[] {
    this.lazyLoad.viewContainerRef.clear();
    const cmpRefs: ComponentRef<any>[] = [];
    components.forEach((component) => {
      const componentFactory = this.cfr.resolveComponentFactory(component);
      cmpRefs.push(this.lazyLoad.viewContainerRef.createComponent(componentFactory));
    });
    this.cdr.detectChanges();
    return cmpRefs;
  }

  private insertModule(module: Type<any>): void {
    const moduleProps = Reflect.get(module, 'ɵmod') as ɵNgModuleDef<any>;
    this.insertComponent(this.maybeUnwrapFn(moduleProps.bootstrap));
  }

  private insertDocs(template: string) {
    const cmpRefs = this.insertComponent([DocsComponent]);
    const docsCmp = cmpRefs[0].instance as DocsComponent;
    docsCmp.template = template;
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    window.onComponentLoad$.subscribe((component) => this.insertComponent([component]));
    window.onModuleLoad$.subscribe((module) => this.insertModule(module));
    window.onDocsLoad$.subscribe((template) => this.insertDocs(template));
  }

  ngOnDestroy(): void {
    window.onComponentLoad$.unsubscribe();
    window.onModuleLoad$.unsubscribe();
    window.onDocsLoad$.unsubscribe();
  }
}

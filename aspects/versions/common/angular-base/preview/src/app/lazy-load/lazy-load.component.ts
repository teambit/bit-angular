import {
  Compiler,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Injector,
  OnDestroy,
  OnInit,
  Type,
  ViewContainerRef,
  NgZone
} from '@angular/core';
import { DocsComponent } from '../docs/docs.component';

@Component({
  selector: 'app-lazy-load',
  template: ``
})
export class LazyLoadComponent implements OnInit, OnDestroy {

  constructor(private cfr: ComponentFactoryResolver, private compiler: Compiler, private injector: Injector, private viewContainerRef: ViewContainerRef, private ngZone: NgZone) {
  }

  /**
   * Unwrap a value which might be behind a closure (for forward declaration reasons).
   */
  private maybeUnwrapFn<T>(value: T | (() => T)): T {
    return value instanceof Function ? value() : value;
  }

  private insertComponent(components: Type<any>[], veCfr?: ComponentFactoryResolver): ComponentRef<any>[] {
    this.viewContainerRef.clear();
    const cmpRefs: ComponentRef<any>[] = [];
    components.forEach((component) => {
      this.ngZone.run(() => {
        const componentFactory = (veCfr || this.cfr).resolveComponentFactory(component);
        const ref = this.viewContainerRef.createComponent(componentFactory);
        cmpRefs.push(ref);
      });
    });
    return cmpRefs;
  }

  private insertModule(module: Type<any>): void {
    const ngModuleFactory = this.compiler.compileModuleSync(module);
    const moduleRef: any = ngModuleFactory.create(this.injector);
    this.insertComponent(this.maybeUnwrapFn(moduleRef._bootstrapComponents), moduleRef.componentFactoryResolver);
  }

  private insertDocs(template: string) {
    this.ngZone.run(() => {
      const cmpRefs = this.insertComponent([DocsComponent]);
      const docsCmp = cmpRefs[0].instance as DocsComponent;
      docsCmp.template = template;
    });
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

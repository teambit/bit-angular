import {
  ChangeDetectorRef,
  Compiler,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Injector,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ɵNgModuleDef
} from '@angular/core';
import { DocsComponent } from '../docs/docs.component';
import { LazyLoadDirective } from './lazy-load.directive';

@Component({
  selector: 'app-lazy-load',
  template: `
    <ng-template lazyLoad></ng-template> `
})
export class LazyLoadComponent implements OnInit, OnDestroy {
  @ViewChild(LazyLoadDirective, { static: true }) lazyLoad!: LazyLoadDirective;

  constructor(private cfr: ComponentFactoryResolver, private cdr: ChangeDetectorRef, private compiler: Compiler, private injector: Injector) {
  }

  /**
   * Unwrap a value which might be behind a closure (for forward declaration reasons).
   */
  private maybeUnwrapFn<T>(value: T | (() => T)): T {
    return value instanceof Function ? value() : value;
  }

  private insertComponent(components: Type<any>[], veCfr?: ComponentFactoryResolver): ComponentRef<any>[] {
    this.lazyLoad.viewContainerRef.clear();
    const cmpRefs: ComponentRef<any>[] = [];
    components.forEach((component) => {
      const componentFactory = (veCfr || this.cfr).resolveComponentFactory(component);
      cmpRefs.push(this.lazyLoad.viewContainerRef.createComponent(componentFactory));
    });
    this.cdr.detectChanges();
    return cmpRefs;
  }

  private insertModule(module: Type<any>): void {
    const moduleProps = Reflect.get(module, 'ɵmod') as ɵNgModuleDef<any>;
    if (moduleProps) {
      // we are using ivy & AOT
      this.insertComponent(this.maybeUnwrapFn(moduleProps.bootstrap));
    } else {
      // we are using view engine & JIT
      const ngModuleFactory = this.compiler.compileModuleSync(module);
      const moduleRef: any = ngModuleFactory.create(this.injector);
      this.insertComponent(this.maybeUnwrapFn(moduleRef._bootstrapComponents), moduleRef.componentFactoryResolver);
    }
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

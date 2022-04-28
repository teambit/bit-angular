import { ComponentRef, Injector, NgModule, OnDestroy, Type, ɵNgModuleDef } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  imports: [BrowserModule]
})
export class AppModule implements OnDestroy {
  compositions: { [selector: string]: HTMLElement } = {};

  constructor(private injector: Injector) {
    window.onComponentLoad$.subscribe((component) => this.insertComponent([component]));
    window.onModuleLoad$.subscribe((module) => void this.insertModule(module));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngDoBootstrap() {
  }

  /**
   * Unwrap a value which might be behind a closure (for forward declaration reasons).
   */
  private maybeUnwrapFn<T>(value: T | (() => T)): T {
    return value instanceof Function ? value() : value;
  }

  private insertComponent<T extends object>(components: Type<T>[]): ComponentRef<T>[] {
    const cmpRefs: ComponentRef<T>[] = [];
    components.forEach((component) => {
      const selector = Reflect.get(component, 'ɵcmp').selectors[0][0] as string;
      let el = this.compositions[selector];
      const root = document.querySelector('#root') as any;
      if (!el) {
        el = document.createElement(selector);
        root.replaceChildren(el);
        this.compositions[selector] = el;
        const custom = createCustomElement(component, { injector: this.injector });
        customElements.define(selector, custom);
      } else {
        root.replaceChildren(el);
      }
    });
    return cmpRefs;
  }

  private async insertModule<T>(module: Type<T>): Promise<void> {
    const moduleProps = Reflect.get(module, 'ɵmod') as ɵNgModuleDef<T>;
    if (moduleProps) {
      // we are using ivy & AOT
      this.insertComponent(this.maybeUnwrapFn(moduleProps.bootstrap));
    } else {
      // we are using view engine & JIT
      console.error('View engine is not supported for compositions, please use ivy');
    }
  }

  ngOnDestroy(): void {
    window.onComponentLoad$.unsubscribe();
    window.onModuleLoad$.unsubscribe();
  }
}


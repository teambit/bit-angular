import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'composition-cmp',
  template: `Composition: <bit-test></bit-test>`
})
class CompositionComponent {}

@NgModule({
  declarations: [CompositionComponent],
  imports: [BrowserModule, BitTestModule],
  bootstrap: [CompositionComponent]
})
export class CompositionModule {
  ngDoBootstrap() {}
}

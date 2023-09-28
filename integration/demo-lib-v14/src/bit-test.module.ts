import { NgModule } from '@angular/core';
import { BitTestComponent } from './bit-test.component';
import { BitTest2Component } from './bit-test2.component';

@NgModule({
  declarations: [
    BitTestComponent,
    BitTest2Component
  ],
  exports: [
    BitTestComponent,
    BitTest2Component
  ]
})
export class BitTestModule {}

import { NgModule } from '@angular/core';
import { BitTestComponent } from './bit-test.component';
import { BitTestService } from './bit-test.service';
import { BitTest2Component } from './bit-test2.component';

@NgModule({
  declarations: [
    BitTestComponent,
    BitTest2Component
  ],
  providers: [BitTestService],
  exports: [
    BitTestComponent,
    BitTest2Component
  ]
})
export class BitTestModule {}

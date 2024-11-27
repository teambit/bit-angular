import { Component, NgModule } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'composition-cmp-v17',
  template: `Composition: <bit-test-v17></bit-test-v17>`
})
class CompositionComponent {}

@NgModule({
  declarations: [CompositionComponent],
  imports: [BitTestModule],
  bootstrap: [CompositionComponent]
})
export class CompositionModule {
}

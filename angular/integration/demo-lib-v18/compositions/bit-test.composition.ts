import { Component, NgModule } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'composition-cmp-v18',
  template: `Composition: <bit-test-v18></bit-test-v18>`
})
class CompositionComponent {}

@NgModule({
  declarations: [CompositionComponent],
  imports: [BitTestModule],
  bootstrap: [CompositionComponent]
})
export class CompositionModule {
}

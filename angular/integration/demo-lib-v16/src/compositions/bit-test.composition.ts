import { Component, NgModule } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'composition-cmp-v16',
  template: `Composition: <bit-test-v16></bit-test-v16>`
})
class CompositionComponent {}

@NgModule({
  declarations: [CompositionComponent],
  imports: [BitTestModule],
  bootstrap: [CompositionComponent]
})
export class CompositionModule {
}

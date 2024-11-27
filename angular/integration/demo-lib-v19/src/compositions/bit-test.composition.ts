import { Component, NgModule } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'composition-cmp-v19',
  standalone: false,
  template: `Composition: <bit-test-v19></bit-test-v19>`
})
class CompositionComponent {}

@NgModule({
  declarations: [CompositionComponent],
  imports: [BitTestModule],
  bootstrap: [CompositionComponent]
})
export class CompositionModule {
}

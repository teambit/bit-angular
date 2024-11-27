import { Component } from '@angular/core';
import { BitTestModule } from '../bit-test.module';
import { BitTest3Component } from "../bit-test3.component";

@Component({
  selector: 'bit-composition-v18',
  standalone: true,
  imports: [BitTestModule, BitTest3Component],
  template: `
      <p>
        Composition component 1
        <bit-test-v19></bit-test-v19>
      </p>
      <p>
        Composition component 2
        <bit-test2-v19></bit-test2-v19>
      </p>
      <p>
        Composition component 3
        <bit-test3-v19></bit-test3-v19>
      </p>
        `,
  styles: [
  ]
})
export class StandaloneCompositionComponent {
}

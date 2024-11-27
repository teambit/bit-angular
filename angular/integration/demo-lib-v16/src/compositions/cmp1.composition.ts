import { Component } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'bit-composition-v16',
  standalone: true,
  imports: [BitTestModule],
  template: `
      <p>
        Composition component 1
        <bit-test-v16></bit-test-v16>
      </p>
        `,
  styles: [
  ]
})
export class StandaloneCompositionComponent {
}

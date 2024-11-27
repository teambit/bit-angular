import { Component } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'bit-composition-v18',
  standalone: true,
  imports: [BitTestModule],
  template: `
      <p>
        Composition component 1
        <bit-test-v18></bit-test-v18>
      </p>
        `,
  styles: [
  ]
})
export class StandaloneCompositionComponent {
}

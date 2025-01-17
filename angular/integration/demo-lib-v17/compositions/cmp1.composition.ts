import { Component } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'bit-composition-v17',
  standalone: true,
  imports: [BitTestModule],
  template: `
      <p>
        Composition component 1
        <bit-test-v17></bit-test-v17>
      </p>
        `,
  styles: [
  ]
})
export class StandaloneCompositionComponent {
}

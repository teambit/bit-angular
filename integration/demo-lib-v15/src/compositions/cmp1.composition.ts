import { Component } from '@angular/core';
import { BitTestModule } from '../bit-test.module';

@Component({
  selector: 'bit-composition',
  standalone: true,
  imports: [BitTestModule],
  template: `
      <p>
        Composition component 1
        <bit-test></bit-test>
      </p>
        `,
  styles: [
  ]
})
export class StandaloneCompositionComponent {
}

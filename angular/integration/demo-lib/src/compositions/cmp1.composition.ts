import { Component } from '@angular/core';
import { BitTestModule } from '../bit-test.module';
import { BitTest3Component } from "../bit-test3.component";

@Component({
  selector: 'bit-composition',
  standalone: true,
  imports: [BitTestModule, BitTest3Component],
  template: `
      <p>
        Composition component 1
        <bit-test></bit-test>
      </p>
      <p>
        Composition component 2
        <bit-test2></bit-test2>
      </p>
      <p>
        Composition component 3
        <bit-test3></bit-test3>
      </p>
        `,
  styles: [
  ]
})
export class StandaloneCompositionComponent {
}

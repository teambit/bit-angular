import { Component, Inject } from '@angular/core';
import { BitTestService } from './bit-test.service';

@Component({
  selector: 'bit-test',
  template: `
      <p>bit-test component works!</p>
      <small>{{ service.content }}</small>
        `
})
export class BitTestComponent {
  constructor(@Inject(BitTestService) public service: BitTestService) {}
}

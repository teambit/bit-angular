import { Component } from '@angular/core';
import { BitTestService } from './compositions/bit-test.service';

@Component({
  selector: 'bit-test',
  template: `
      <p>bit-test component works!</p>
      <small>{{ service.content }}</small>
        `
})
export class BitTestComponent {
  constructor(public service: BitTestService) {}
}

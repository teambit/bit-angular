import { Component } from "@angular/core";
import { BitTestService } from './bit-test.service';

@Component({
  selector: 'bit-test-v16',
  standalone: false,
  template: `
      <p>bit-test component works!</p>
      <small>{{ service.content }}</small>
        `
})
export class BitTestComponent {
  constructor(public service: BitTestService) {}
}

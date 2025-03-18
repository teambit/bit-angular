import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'demo-elements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>
    demo-elements works!!
    Made by {{ name() }}.
    </p>
`,
  styleUrls: ['./demo-elements.component.scss']
})
export class DemoElementsComponent {
  name = input<string>('Bit');
  constructor() {}
}

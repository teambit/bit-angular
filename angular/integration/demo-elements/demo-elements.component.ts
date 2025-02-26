import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'demo-elements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>
    demo-elements works!!
    </p>
`,
  styleUrls: ['./demo-elements.component.scss']
})
export class DemoElementsComponent {
  constructor() {}
}

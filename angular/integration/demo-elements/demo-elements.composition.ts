import { Component } from '@angular/core';
import { DemoElementsComponent } from './demo-elements.component';

@Component({
  standalone: true,
  selector: 'demo-elements-composition-cmp',
  imports: [DemoElementsComponent],
  template: `DemoElements composition: <demo-elements name="Bit"></demo-elements>`
})
export class DemoElementsCompositionComponent {}

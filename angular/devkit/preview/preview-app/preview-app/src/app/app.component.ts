/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `<app-lazy-load class='primaryPalette'></app-lazy-load>`,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'bit-angular';
}

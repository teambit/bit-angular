import { Component, OnInit, NgModule } from '@angular/core';

@Component({
  selector: 'bit-test2',
  template: `
      <p>
      bit-test 2 works as well!
      </p>
        `,
  styles: [
  ]
})
export class CompositionComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}

@NgModule({
  declarations: [
    CompositionComponent
  ],
  imports: [],
  exports: [
    CompositionComponent
  ]
})
export class CompositionModule {}

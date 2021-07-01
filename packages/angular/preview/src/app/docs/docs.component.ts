import { Component, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-docs',
  template: ` <div #docsRoot [innerHTML]="template | safeHtml"></div> `,
  styleUrls: ['./docs.style.scss'],
})
export class DocsComponent {
  @ViewChild('docsRoot', { static: true }) docsRoot!: ElementRef;
  @Input() template = '';
}

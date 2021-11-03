import { Component, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-docs',
  template: `
    <div class='docsMainBlock'>
      <app-context>
        <div class='header'>
          <heading element='h1'>{{displayName | titlecase}}</heading>
          <heading element='h2' class='subTitle' *ngIf='description'>{{description}}</heading>
          <docs-label-list [labels]='labels'></docs-label-list>
          <consumable-link title='Package name' [link]='packageName'></consumable-link>
        </div>
        <separator></separator>
        <div class='md' #docsRoot [innerHTML]="template | safeHtml"></div>
      </app-context>
    </div>
  `,
  styleUrls: ['./docs.style.scss'],
})
export class DocsComponent {
  @ViewChild('docsRoot', { static: true }) docsRoot!: ElementRef;
  @Input() template = '';
  @Input() displayName = '';
  @Input() packageName = '';
  @Input() description = '';
  @Input() labels: string[] = [];
}

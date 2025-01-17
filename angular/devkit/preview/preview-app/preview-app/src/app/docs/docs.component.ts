/* eslint-disable @typescript-eslint/no-unused-vars */
import { isPlatformBrowser } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';

// importing prismjs order is important!
import 'prismjs';

import 'prismjs/plugins/toolbar/prism-toolbar';

import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/show-language/prism-show-language';

import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-visual-basic';
import 'prismjs/components/prism-xml-doc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Prism: any;

@Component({
  selector: 'app-docs',
  standalone: false,
  template: ` <div #docsRoot [innerHTML]="template | safeHtml" class='docsMainBlock'></div> `,
  styleUrls: ['./docs.style.scss'],
})
export class DocsComponent implements AfterViewChecked {
  @ViewChild('docsRoot', { static: true }) docsRoot!: ElementRef;

  @Input() template = '';

  highlighted = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewChecked() {
    if (!this.highlighted && isPlatformBrowser(this.platformId)) {
      this.highlightHtml();
      this.highlighted = true;
    }
  }

  highlightHtml() {
    const codeElements = this.docsRoot.nativeElement.querySelectorAll('pre[data-language]');
    codeElements.forEach((el: HTMLElement) => {
      const lang = el.getAttribute('data-language')?.replace('language-', '') || 'javascript';
      el.setAttribute('class', `language-${lang}`);
      // eslint-disable-next-line no-param-reassign
      el.innerHTML = Prism.highlight(el.textContent || '', Prism.languages[lang], lang);
    });
  }
}

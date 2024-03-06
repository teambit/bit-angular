/* eslint-disable @typescript-eslint/no-unused-vars */
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import dompurify from 'dompurify';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    const sanitizedContent = dompurify.sanitize(value);
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedContent);
  }
}

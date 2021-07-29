import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DocsComponent } from './docs.component';
import { SafeHtmlPipe } from './safe-html.pipe';

@NgModule({
  entryComponents: [DocsComponent],
  declarations: [SafeHtmlPipe, DocsComponent],
  exports: [BrowserModule, SafeHtmlPipe, DocsComponent],
})
export class DocsModule {}

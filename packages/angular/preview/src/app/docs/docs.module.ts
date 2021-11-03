import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HeadingModule } from '@teambit/base-ui.ng.text.heading';
import { SeparatorModule } from '@teambit/design.ng.content.separator';
import { ConsumableLinkModule } from '@teambit/documenter.ng.content.consumable-link';
import { LabelListModule } from '@teambit/documenter.ng.content.label-list';
import { AppContextModule } from '@teambit/design.ng.theme.app-context';
import { DocsComponent } from './docs.component';
import { SafeHtmlPipe } from './safe-html.pipe';

@NgModule({
  entryComponents: [DocsComponent],
  declarations: [SafeHtmlPipe, DocsComponent],
  imports: [CommonModule, HeadingModule, SeparatorModule, ConsumableLinkModule, LabelListModule, CommonModule, AppContextModule, HeadingModule],
  exports: [BrowserModule, SafeHtmlPipe, DocsComponent],
})
export class DocsModule {}

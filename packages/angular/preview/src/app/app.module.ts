import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DocsComponent } from './docs/docs.component';
import { SafeHtmlPipe } from './docs/safe-html.pipe';
import { LazyLoadComponent } from './lazy-load/lazy-load.component';

@NgModule({
  declarations: [AppComponent, LazyLoadComponent, SafeHtmlPipe, DocsComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent]
})
export class AppModule {
}

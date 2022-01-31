import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { DocsComponent } from './docs/docs.component';
import { SafeHtmlPipe } from './docs/safe-html.pipe';
import { LazyLoadComponent } from './lazy-load/lazy-load.component';

@NgModule({
  declarations: [AppComponent, LazyLoadComponent, SafeHtmlPipe, DocsComponent],
  imports: [BrowserAnimationsModule],
  bootstrap: [AppComponent]
})
export class AppModule {
}

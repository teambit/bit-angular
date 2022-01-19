import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DocsModule } from './docs/docs.module';
import { LazyLoadComponent } from './lazy-load/lazy-load.component';

@NgModule({
  declarations: [AppComponent, LazyLoadComponent],
  imports: [BrowserModule, DocsModule],
  bootstrap: [AppComponent]
})
export class AppModule {
}

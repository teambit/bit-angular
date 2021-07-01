import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DocsModule } from './docs/docs.module';
import { LazyLoadComponent } from './lazy-load/lazy-load.component';
import { LazyLoadDirective } from './lazy-load/lazy-load.directive';

@NgModule({
  declarations: [AppComponent, LazyLoadDirective, LazyLoadComponent],
  imports: [BrowserModule, DocsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

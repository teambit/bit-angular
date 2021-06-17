import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
// import { LazyLoadComponent } from './lazy-load/lazy-load.component';
// import { LazyLoadDirective } from './lazy-load/lazy-load.directive';

@NgModule({
  declarations: [
    AppComponent,
    // LazyLoadDirective,
    // LazyLoadComponent
  ],
  imports: [
    CommonModule,
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}

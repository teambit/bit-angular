import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { DocsModule } from './docs/docs.module';
import { LazyLoadComponent } from './lazy-load/lazy-load.component';

@NgModule({
  declarations: [AppComponent, LazyLoadComponent],
  imports: [CommonModule, BrowserModule, BrowserAnimationsModule, HttpClientModule, /*RouterModule.forRoot([]),*/ ReactiveFormsModule, FormsModule, DocsModule],
  bootstrap: [AppComponent]
})
export class AppModule {
}

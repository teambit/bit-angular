import { ComponentContext, ComponentFile } from '@teambit/generator';

export const appModuleFile = (context: ComponentContext): ComponentFile => {
  return {
    relativePath: `src/app/app.module.ts`,
    content: `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
`,
  };
};

import { ComponentFile } from '@teambit/generator';

export const appModuleFile = (ssr: boolean): ComponentFile => {
  return {
    relativePath: `src/app/app.module.ts`,
    content: `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';${ssr ? `
import { provideClientHydration } from '@angular/platform-browser';` : ''}
import { routes } from './app.routes';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  providers: [${ssr ? `provideClientHydration()` : ``}],
  bootstrap: [AppComponent]
})
export class AppModule { }
`,
  };
};

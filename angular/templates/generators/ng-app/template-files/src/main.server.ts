import { ComponentFile } from '@teambit/generator';

export const mainServerFile = (standalone: boolean): ComponentFile => {
  return {
    relativePath: `src/main.server.ts`,
    content: `import 'zone.js/node';
${standalone ? `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

export default function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}` : `import { provideServerRendering } from '@angular/platform-server';
import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppModule } from './app/app.module';
import { AppComponent } from './app/app.component';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
  ],
  providers: [provideServerRendering()],
  bootstrap: [AppComponent],
})
export default class AppServerModule {}`}`,
  };
};

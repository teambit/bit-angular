import { NgModuleRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

window.ngMainStart = async function(): Promise<NgModuleRef<any> | void> {
  return platformBrowserDynamic().bootstrapModule(AppModule)
    .catch((err: any) => console.error(err));
}

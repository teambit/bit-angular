import { NgModuleRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

window.ngMainStart = async function start(): Promise<NgModuleRef<any> | void> {
  return platformBrowserDynamic().bootstrapModule(AppModule)
    // eslint-disable-next-line no-console
    .catch((err: any) => console.error(err));
}

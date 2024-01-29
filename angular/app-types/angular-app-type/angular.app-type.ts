import { NG_APP_NAME } from '@bitdev/angular.dev-services.common';
import { Application, ApplicationType } from '@teambit/application';
import { EnvHandler } from '@teambit/envs';
import { AngularAppOptions } from './angular-app-options';
import { AngularApp } from './angular.application';

interface AngularAppTypeOptions {
  name?: string;
}

export class AngularAppType implements ApplicationType<AngularAppOptions> {
  constructor(readonly name: string) {}

  createApp(options: AngularAppOptions): Application {
    return new AngularApp({
      ...options,
      name: this.name
    });
  }

  static from(options: AngularAppTypeOptions): EnvHandler<AngularAppType> {
    return () => {
      const name = options.name || NG_APP_NAME;
      return new AngularAppType(name);
    };
  }
}

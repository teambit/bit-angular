import { Application, ApplicationType } from '@teambit/application';
import { AngularAppOptions } from './angular-app-options';
import { AngularApp } from './angular.application';
import { GenericAngularEnv } from './generic-angular-env';

export class AngularAppType implements ApplicationType<AngularAppOptions> {
  constructor(readonly name: string, private angularEnv: GenericAngularEnv) {}

  async createApp(options: AngularAppOptions): Promise<Application> {
    return new AngularApp(
      this.angularEnv,
      options
    );
  }
}

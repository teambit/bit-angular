import { GenericAngularEnv } from '@teambit/angular-common';
import { Application, ApplicationType } from '@teambit/application';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { AngularAppOptions } from './angular-app-options';
import { AngularApp } from './angular.application';
import { NG_APP_NAME } from './utils';

interface AngularAppTypeOptions {
  name?: string;
  angularEnv: GenericAngularEnv;
}

export class AngularAppType implements ApplicationType<AngularAppOptions> {
  constructor(readonly name: string, private angularEnv: GenericAngularEnv, private context: EnvContext) {}

  createApp(options: AngularAppOptions): Application {
    return new AngularApp(
      this.angularEnv,
      this.context,
      options
    );
  }

  static from(options: AngularAppTypeOptions): EnvHandler<AngularAppType> {
    return (context: EnvContext) => {
      const name = options.name || NG_APP_NAME;
      return new AngularAppType(name, options.angularEnv, context);
    };
  }
}

import { GenericAngularEnv } from '@teambit/angular-common';
import { Application, ApplicationType } from '@teambit/application';
import { DependencyResolverAspect, DependencyResolverMain } from '@teambit/dependency-resolver';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { Workspace, WorkspaceAspect } from '@teambit/workspace';
import { AngularAppOptions } from './angular-app-options';
import { AngularApp } from './angular.application';
import { NG_APP_NAME } from './utils';

interface AngularAppTypeOptions {
  name?: string;
  angularEnv: GenericAngularEnv;
}

export class AngularAppType implements ApplicationType<AngularAppOptions> {
  constructor(readonly name: string, private angularEnv: GenericAngularEnv, private context: EnvContext, private depsResolver: DependencyResolverMain, private workspace: Workspace) {}

  createApp(options: AngularAppOptions): Application {
    return new AngularApp(
      this.angularEnv,
      this.context,
      this.depsResolver,
      this.workspace,
      options,
    );
  }

  static from(options: AngularAppTypeOptions): EnvHandler<AngularAppType> {
    return (context: EnvContext) => {
      const name = options.name || NG_APP_NAME;
      const depsResolver = context.getAspect<DependencyResolverMain>(DependencyResolverAspect.id);
      const workspace = context.getAspect<Workspace>(WorkspaceAspect.id);
      return new AngularAppType(name, options.angularEnv, context, depsResolver, workspace);
    };
  }
}

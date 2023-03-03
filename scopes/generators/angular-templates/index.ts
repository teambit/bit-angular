import { EnvHandler } from '@teambit/envs';
import { ComponentTemplate } from '@teambit/generator';
import { NgAppTemplate } from './ng-app';
import { NgEnvTemplate } from './ng-env';
import { NgModuleTemplate } from './ng-module';

export { NgModuleTemplate } from './ng-module';
export { NgEnvTemplate } from './ng-env';
export { NgAppTemplate } from './ng-app';


export function angularBaseTemplates(envName: string, packageName: string, angularVersion: number): EnvHandler<ComponentTemplate>[] {
  return [NgModuleTemplate.from({envName, packageName, angularVersion}), NgEnvTemplate.from({envName, packageName, angularVersion}), NgAppTemplate.from({envName, packageName, angularVersion})]
}


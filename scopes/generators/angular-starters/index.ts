import { EnvHandler } from '@teambit/envs';
import { WorkspaceTemplate } from '@teambit/generator';
import { NgWorkspaceTemplate } from './ng-workspace';

export { NgWorkspaceTemplate } from './ng-workspace';


export function workspaceStarters(envName: string, packageName: string, angularVersion: number): EnvHandler<WorkspaceTemplate>[] {
  return [NgWorkspaceTemplate.from({envName, packageName, angularVersion})]
}

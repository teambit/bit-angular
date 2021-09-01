import { ComponentTemplate, WorkspaceTemplate } from '@teambit/generator';
import { ngEnvTemplate } from './templates/ng-env';
import { ngLibTemplate } from './templates/ng-lib';
import { ngWorkspaceTemplate } from './templates/ng-workspace';

export const angularTemplates: ComponentTemplate[] = [ngLibTemplate, ngEnvTemplate];
export const workspaceTemplates: WorkspaceTemplate[] = [ngWorkspaceTemplate];

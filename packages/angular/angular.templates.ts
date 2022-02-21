import { ComponentTemplate, WorkspaceTemplate } from '@teambit/generator';
import { ngAppTemplate } from './templates/ng-app';
import { ngEnvTemplate } from './templates/ng-env';
import { ngModuleTemplate } from './templates/ng-module';
import { ngWorkspaceTemplate } from './templates/ng-workspace';

export const angularTemplates: ComponentTemplate[] = [ngModuleTemplate, ngEnvTemplate, ngAppTemplate];
export const workspaceTemplates: WorkspaceTemplate[] = [ngWorkspaceTemplate];

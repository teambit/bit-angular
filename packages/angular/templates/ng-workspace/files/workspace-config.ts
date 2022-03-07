import { WorkspaceContext } from '@teambit/generator';
import { getWorkspaceConfigTemplateParsed, stringifyWorkspaceConfig } from '@teambit/config';

export async function workspaceConfig({ name, defaultScope, aspectComponent }: WorkspaceContext) {
  const scope = defaultScope || 'company.scope';
  const envScopeId = aspectComponent!.id.toString();
  const configParsed = await getWorkspaceConfigTemplateParsed();
  configParsed['teambit.workspace/workspace'].name = name;
  configParsed['teambit.workspace/workspace'].defaultScope = scope;
  configParsed['teambit.workspace/workspace'].name = name;
  configParsed['teambit.dependencies/dependency-resolver'].packageManager = 'teambit.dependencies/yarn';
  configParsed[envScopeId] = {};
  configParsed['teambit.workspace/variants'] = {
    '*': {
      [envScopeId]: {}
    }
  };
  configParsed['teambit.generator/generator'] = {
    'aspects': [
      aspectComponent!.id.toStringWithoutVersion()
    ]
  };

  return stringifyWorkspaceConfig(configParsed);
}

import { WorkspaceContext } from '@teambit/generator';
import { getWorkspaceConfigTemplateParsed, stringifyWorkspaceConfig } from '@teambit/config';
import { DEFAULT_SCOPE_NAME, FORKED_ENV_NAME } from '../constants';

export async function workspaceConfig({ name, defaultScope, aspectComponent }: WorkspaceContext, envPkgName: string, appName?: string) {
  const scope = defaultScope || DEFAULT_SCOPE_NAME;
  const envVersion = aspectComponent!.latest;
  const configParsed = await getWorkspaceConfigTemplateParsed();
  configParsed['teambit.workspace/workspace'].name = name;
  configParsed['teambit.workspace/workspace'].defaultScope = scope;
  configParsed['teambit.workspace/workspace'].resolveEnvsFromRoots = true;
  configParsed['teambit.dependencies/dependency-resolver'].packageManager = 'teambit.dependencies/pnpm';
  configParsed['teambit.dependencies/dependency-resolver'].rootComponents = true;
  configParsed['teambit.dependencies/dependency-resolver'].policy = {
    "dependencies": {
      [envPkgName]: `^${envVersion}`
    },
    "peerDependencies": {}
  };

  // Use the forked env as the default env for generated components
  configParsed['teambit.generator/generator'] = { envs: [`${scope}/${FORKED_ENV_NAME}`] };

  // If an app name is provided, add it to the workspace config
  if (appName) {
    configParsed[`${scope}/${appName}`] = {};
  }

  delete configParsed['teambit.workspace/variants'];

  return stringifyWorkspaceConfig(configParsed);
}

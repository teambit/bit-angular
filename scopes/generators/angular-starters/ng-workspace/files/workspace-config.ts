import { WorkspaceContext } from '@teambit/generator';
import { getWorkspaceConfigTemplateParsed, stringifyWorkspaceConfig } from '@teambit/config';
import { DEFAULT_SCOPE_NAME, FORKED_ENV_NAME } from '../../constants';

export async function workspaceConfig({ name, defaultScope, aspectComponent }: WorkspaceContext, envPkgName: string) {
  const scope = defaultScope || DEFAULT_SCOPE_NAME;
  const envId = aspectComponent!.id.toStringWithoutVersion();
  const envVersion = aspectComponent!.latest;
  /**
   * a ws that was generated by the react-env should use the forked env
   */
  const generatorEnv =
    envId === 'teambit.angular/angular' ? `${scope}/${FORKED_ENV_NAME}` : envId;
  const configParsed = await getWorkspaceConfigTemplateParsed();
  configParsed['teambit.workspace/workspace'].name = name;
  configParsed['teambit.workspace/workspace'].defaultScope = scope;
  configParsed['teambit.dependencies/dependency-resolver'].packageManager = 'teambit.dependencies/yarn';
  configParsed['teambit.dependencies/dependency-resolver'].policy = {
    "dependencies": {
      [envPkgName]: `^${envVersion}`
    },
    "peerDependencies": {}
  };
  configParsed['teambit.generator/generator'] = {
    envs: [generatorEnv],
  };

  delete configParsed['teambit.workspace/variants'];

  return stringifyWorkspaceConfig(configParsed);
}

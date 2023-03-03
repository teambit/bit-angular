import { ComponentID } from "@teambit/component";
import { IsolatorMain } from "@teambit/isolator";
import { Workspace } from "@teambit/workspace";
import { resolve } from 'path';

export function getNodeModulesPaths(build: boolean, isolator: IsolatorMain, workspace?: Workspace): string[] {
  if (!workspace) {
    return [];
  }
  const workspaceDir = workspace.path;
  const scopeAspectsRootDir = isolator.getCapsulesRootDir(workspace.scope.getAspectCapsulePath());
  const workspaceCapsulesRootDir = build ? isolator.getCapsulesRootDir(workspace.path) : undefined;


  const nodeModulesPaths: string[] = [];
  const workspaceNodeModules = resolve(workspaceDir, 'node_modules');

  if (workspaceCapsulesRootDir) {
    const workspaceCapsuleNodeModules = resolve(workspaceCapsulesRootDir, 'node_modules');
    // Add the workspace capsule node modules
    nodeModulesPaths.push(workspaceCapsuleNodeModules);
  }

  // Check if we are in the aspects capsule
  if (!__dirname.startsWith(workspaceNodeModules)) {
    const aspectsCapsuleNodeModules = resolve(scopeAspectsRootDir, 'node_modules');
    // Add the aspects capsule node modules
    nodeModulesPaths.push(aspectsCapsuleNodeModules);
  }

  // Add the workspace node modules
  nodeModulesPaths.push(workspaceNodeModules, 'node_modules');

  return nodeModulesPaths;
}

/**
 * Returns the value of the option or its default value if undefined
 */
export function optionValue<T>(value: T | undefined, defaultValue: T) {
  return typeof value === 'undefined' ? defaultValue : value;
}

export async function loadEsmModule<T>(modulePath: string): Promise<T> {
  try {
    return await import(modulePath);
  } catch(e) {
    return new Function('modulePath', `return import(modulePath)`)(modulePath) as Promise<T>;
  }
}

export function cmpIdToPkgName(componentId: ComponentID) {
  const allSlashes = new RegExp('/', 'g');
  const name = componentId.fullName.replace(allSlashes, '.');
  const scope = componentId.scope.split('.').join('/');
  const partsToJoin = scope ? [scope, name] : [name];
  return `@${partsToJoin.join('.')}`;
}
import { existsSync } from 'fs';
import path, { resolve } from 'path';
import { Compiler } from 'webpack';

// Extract Resolver type from Webpack types since it is not directly exported
export type ResolverWithOptions = ReturnType<Compiler['resolverFactory']['get']>;

export function tryResolvePackage(resolver: ResolverWithOptions, moduleName: string, nodeModulesDir: string): string | undefined {
  try {
    const resolvedPath = resolver.resolveSync(
      {},
      nodeModulesDir,
      `${moduleName}/package.json`
    );

    return resolvedPath || undefined;
  } catch {
    // Ex: @angular/compiler/src/i18n/i18n_ast/package.json
    // or local libraries which don't reside in node_modules
    const packageJsonPath = path.resolve(nodeModulesDir, '../package.json');

    return existsSync(packageJsonPath) ? packageJsonPath : undefined;
  }
}

export function getNodeModulesPaths(workspaceDir: string, scopeAspectsRootDir: string, workspaceCapsulesRootDir?: string) {
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
  nodeModulesPaths.push(workspaceNodeModules);

  return nodeModulesPaths;
}

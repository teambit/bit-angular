import { existsSync } from 'fs';
import { resolve } from 'path';

export function tryResolvePackage(resolver: any, moduleName: string, nodeModulesDir: string): string | undefined {
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
    const packageJsonPath = resolve(nodeModulesDir, '../package.json');

    return existsSync(packageJsonPath) ? packageJsonPath : undefined;
  }
}

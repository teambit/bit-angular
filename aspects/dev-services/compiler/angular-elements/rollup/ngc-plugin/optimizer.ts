import { buildOptimizer } from '@angular-devkit/build-optimizer'
import { readdirSync } from 'fs'
import { join } from 'path'
import { TransformResult } from 'rollup';

export const defautSideEffects = (sideEffectFreeModules?: string[]) => {
  const sideEffects = readdirSync('node_modules/@angular')
    .map(effect => join('node_modules/@angular', effect))
  return [
    ...sideEffects,
    'node_modules/rxjs',
    ...(sideEffectFreeModules ?? [])
  ].map(p => p.replace(/\\/g, '/'))
}

// Angular packages are known to have no side effects.
const knownSideEffectFreeAngularModules = [
  /[\\/]node_modules[\\/]@angular[\\/]animations[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]common[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]compiler[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]core[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]forms[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]http[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]platform-browser-dynamic[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]platform-browser[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]platform-webworker-dynamic[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]platform-webworker[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]router[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]upgrade[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]material[\\/]/,
  /[\\/]node_modules[\\/]@angular[\\/]cdk[\\/]/,
  /[\\/]node_modules[\\/]rxjs[\\/]/,
];

// Known locations for the source files of @angular/core.
const coreFilesRegex = /[\\/]node_modules[\\/]@angular[\\/]core[\\/][f]?esm20(15|20)[\\/]/;

function isKnownCoreFile(filePath: string) {
  return coreFilesRegex.test(filePath);
}

function isKnownSideEffectFree(filePath: string) {
  // rxjs add imports contain intentional side effects
  if (/[\\/]node_modules[\\/]rxjs[\\/]add[\\/]/.test(filePath)) {
    return false;
  }

  return knownSideEffectFreeAngularModules.some((re) => re.test(filePath));
}

export interface OptimizerOptions {
  sideEffectFreeModules?: string[]
  angularCoreModules?: string[]
}

/// this is original code from
/// https://github.com/angular/angular-cli/blob/master/packages/angular_devkit/build_optimizer/src/build-optimizer/rollup-plugin.ts
export function optimizer(content: string, id: string, options: OptimizerOptions): TransformResult {
  const normalizedId = id.replace(/\\/g, '/');
  const isSideEffectFree = isKnownSideEffectFree(normalizedId) || (options.sideEffectFreeModules && options.sideEffectFreeModules.some(m => normalizedId.indexOf(m) >= 0));
  const isAngularCoreFile = isKnownCoreFile(normalizedId) || (options.angularCoreModules && options.angularCoreModules.some(m => normalizedId.indexOf(m) >= 0));

  const result = buildOptimizer({
    content,
    inputFilePath: id,
    emitSourceMap: true,
    isSideEffectFree,
    isAngularCoreFile,
  })

  return {
    code: result.content || undefined,
    map: result.sourceMap
  }
}

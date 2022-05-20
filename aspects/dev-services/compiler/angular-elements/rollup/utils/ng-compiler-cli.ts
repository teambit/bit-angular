async function loadEsmModule<T>(modulePath: string): Promise<T> {
  try {
    return await import(modulePath);
  } catch(e) {
    return new Function('modulePath', `return import(modulePath)`)(modulePath) as Promise<T>;
  }
}

export async function ngCompilerCli(): Promise<typeof import('@angular/compiler-cli')> {
  return loadEsmModule(`@angular/compiler-cli`);
}

// returns typeof import('@angular/compiler-cli/linker/babel'), but doesn't work on old versions of Angular
export async function ngBabelLinker(): Promise<any> {
  return loadEsmModule(`@angular/compiler-cli/linker/babel/index.js`);
}

export async function ngccCompilerCli(): Promise<typeof import('@angular/compiler-cli/ngcc')> {
  return loadEsmModule(`@angular/compiler-cli/ngcc`);
}

export async function ngtscFileSystemCompilerCli(): Promise<typeof import('@angular/compiler-cli/src/ngtsc/file_system')> {
  return loadEsmModule(`@angular/compiler-cli/src/ngtsc/file_system/index.js`);
}

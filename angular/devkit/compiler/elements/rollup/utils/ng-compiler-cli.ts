async function loadEsmModule<T>(modulePath: string): Promise<T> {
  try {
    return await import(modulePath);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return new Function('modulePath', `return import(modulePath)`)(modulePath) as Promise<T>;
  }
}

export async function ngccCompilerCli(): Promise<any> {
  return loadEsmModule(`@angular/compiler-cli/ngcc`);
}

// @ts-ignore
export async function ngCompilerCli(): Promise<typeof import('@angular/compiler-cli')> {
  return loadEsmModule(`@angular/compiler-cli`);
}

// returns typeof import('@angular/compiler-cli/linker/babel'), but doesn't work on old versions of Angular
export async function ngBabelLinker(): Promise<any> {
  try {
    // Angular v13+
    return await loadEsmModule(`@angular/compiler-cli/linker/babel`);
  } catch (e) {
    // Angular v12
    return loadEsmModule(`@angular/compiler-cli/linker/babel/index.js`);
  }
}

export async function getNodeJSFileSystem(): Promise<any> {
  // Angular v13+
  // @ts-ignore
  const { NodeJSFileSystem} = await ngCompilerCli();
  if (typeof NodeJSFileSystem !== 'undefined') {
    return NodeJSFileSystem;
  }
  // Angular v12
  // @ts-ignore
  return (await loadEsmModule(`@angular/compiler-cli/src/ngtsc/file_system/index.js`)).NodeJSFileSystem;
}

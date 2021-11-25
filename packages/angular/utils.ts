import { URL } from 'url';

/**
 * Returns the value of the option or its default value if undefined
 */
export function optionValue<T>(value: T, defaultValue: T) {
  return typeof value === 'undefined' ? defaultValue : value;
}

export async function loadEsmModule<T>(modulePath: string | URL): Promise<T> {
  return new Function('modulePath', `return import(modulePath)`)(modulePath) as Promise<T>;
}

function isPromise<T>(fct: any): fct is Promise<T> {
  return !!fct && typeof fct.then === 'function'
}

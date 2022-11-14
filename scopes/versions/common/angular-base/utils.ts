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

/**
 * Returns the value of the option or its default value if undefined
 */
export function optionValue<T>(value: T, defaultValue: T) {
  return typeof value === 'undefined' ? defaultValue : value;
}

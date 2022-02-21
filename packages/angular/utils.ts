import { ApplicationMain } from "@teambit/application";
import { Component } from "@teambit/component";
import { NG_APP_PATTERN } from './angular.env';

/**
 * Returns the value of the option or its default value if undefined
 */
export function optionValue<T>(value: T, defaultValue: T) {
  return typeof value === 'undefined' ? defaultValue : value;
}

export async function loadEsmModule<T>(modulePath: string): Promise<T> {
  try {
    return await import(modulePath);
  } catch(e) {
    return new Function('modulePath', `return import(modulePath)`)(modulePath) as Promise<T>;
  }
}

export function componentIsApp(component: Component, application: ApplicationMain): boolean {
  // We first check if the component is registered as an app
  return !!application.getApp(component.id.name)
    // If it returns false, it might be because the app has never been compiled and has not been detected as an app yet
    // In this case we check all the existing files for the ng app pattern
    || component.filesystem.byGlob([NG_APP_PATTERN]).length > 0;
}

import { ApplicationMain } from "@teambit/application";
import { Component } from "@teambit/component";

export const NG_APP_NAME = 'ng-app';
export const NG_APP_PATTERN = `*.${NG_APP_NAME}.*`;

export function componentIsApp(component: Component, application: ApplicationMain): boolean {
  // We first check if the component is registered as an app
  return !!application.getApp(component.id.name)
    // If it returns false, it might be because the app has never been compiled and has not been detected as an app yet
    // In this case we check all the existing files for the ng app pattern
    || component.filesystem.byGlob([NG_APP_PATTERN]).length > 0;
}

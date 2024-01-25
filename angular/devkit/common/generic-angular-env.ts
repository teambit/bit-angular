import type {
  ApplicationBuilderOptions,
  BrowserBuilderOptions,
  DevServerBuilderOptions
} from '@bitdev/angular.dev-services.ng-compat';
import { AppsEnv } from '@teambit/application';
import { BuilderEnv } from '@teambit/builder';
import { CompilerEnv } from '@teambit/compiler';
import { PreviewEnv } from '@teambit/preview';
import { AngularEnvOptions } from './env-options';

export type BrowserOptions = Omit<BrowserBuilderOptions, "outputPath" | "deleteOutputPath" | "preserveSymlinks" | "inlineStyleLanguage"> & {inlineStyleLanguage?: "css" | "less" | "sass" | "scss"};
export type DevServerOptions = Omit<DevServerBuilderOptions, "aot" | "baseHref" | "browserTarget" | "commonChunk" | "deployUrl" | "hmrWarning" | "open" | "progress" | "servePathDefaultWarning" | "vendorChunk">;
export type ApplicationOptions = Omit<ApplicationBuilderOptions, "outputPath" | "deleteOutputPath" | "preserveSymlinks" | "aot">

export interface GenericAngularEnv
  extends AppsEnv,
    CompilerEnv,
    PreviewEnv,
    BuilderEnv {
  getNgEnvOptions(): AngularEnvOptions;
}

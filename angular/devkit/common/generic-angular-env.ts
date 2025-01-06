import type {
  ApplicationBuilderOptions,
  BrowserBuilderOptions,
  DevServerBuilderOptions,
  OutputMode
} from '@bitdev/angular.dev-services.ng-compat';
import { AppsEnv } from '@teambit/application';
import { BuilderEnv } from '@teambit/builder';
import { CompilerEnv } from '@teambit/compiler';
import { PreviewEnv } from '@teambit/preview';
import { AngularEnvOptions } from './env-options';

export type BrowserOptions =
  Omit<BrowserBuilderOptions, "outputPath" | "deleteOutputPath" | "preserveSymlinks" | "inlineStyleLanguage">
  & { inlineStyleLanguage?: "css" | "less" | "sass" | "scss" };
export type DevServerOptions =
  Omit<DevServerBuilderOptions, "buildTarget" | "aot" | "baseHref" | "browserTarget" | "commonChunk" | "deployUrl" | "hmrWarning" | "open" | "progress" | "servePathDefaultWarning" | "vendorChunk">
  & { buildTarget?: "development" | "production" };
export type ApplicationOptions =
  Omit<ApplicationBuilderOptions, "outputPath" | "deleteOutputPath" | "preserveSymlinks" | "aot" | "inlineStyleLanguage" | "outputMode">
  & { inlineStyleLanguage?: "css" | "less" | "sass" | "scss", outputMode?: "static" | "server" | OutputMode };

/** Internal options hidden from builder schema but available when invoked programmatically. */
export interface InternalOptions {
  /**
   * Entry points to use for the compilation. Incompatible with `browser`, which must not be provided. May be relative or absolute paths.
   * If given a relative path, it is resolved relative to the current workspace and will generate an output at the same relative location
   * in the output directory. If given an absolute path, the output will be generated in the root of the output directory with the same base
   * name.
   */
  entryPoints?: Set<string>;

  /** File extension to use for the generated output files. */
  outExtension?: 'js' | 'mjs';

  /**
   * Indicates whether all node packages should be marked as external.
   * Currently used by the dev-server to support prebundling.
   */
  externalPackages?: boolean | { exclude: string[] };

  /**
   * Forces the output from the localize post-processing to not create nested directories per locale output.
   * This is only used by the development server which currently only supports a single locale per build.
   */
  forceI18nFlatOutput?: boolean;
}

export type ApplicationInternalOptions = Omit<
  ApplicationOptions & InternalOptions,
  'browser'
> & {
  // `browser` can be `undefined` if `entryPoints` is used.
  browser?: string;
};

export interface GenericAngularEnv
  extends AppsEnv,
    CompilerEnv,
    PreviewEnv,
    BuilderEnv {
  getNgEnvOptions(): AngularEnvOptions;
}

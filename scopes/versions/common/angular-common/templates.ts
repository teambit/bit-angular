export interface AngularComponentTemplateOptions {
  name?: string;
  description?: string;
  // whether to hide the template from the `bit templates` command.
  hidden?: boolean;
  envName?: string;
  angularVersion?: number;
}

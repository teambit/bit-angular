import { AngularComponentTemplateOptions } from '@teambit/angular-common';
import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { indexFile } from './template-files';
import { docsFile } from './template-files/docs';
import { ngAppFile } from './template-files/ng-app';
import { appComponentFile } from './template-files/src/app/app.component';
import { appComponentHtmlFile } from './template-files/src/app/app.component-html';
import { appComponentScssFile } from './template-files/src/app/app.component-scss';
import { appComponentSpecFile } from './template-files/src/app/app.component-spec';
import { appModuleFile } from './template-files/src/app/app.module';
import { gitKeepFile } from './template-files/src/assets/gitkeep';
import { environmentFile } from './template-files/src/environments/environment';
import { environmentProdFile } from './template-files/src/environments/environment.prod';
import { indexHtmlFile } from './template-files/src/index-html';
import { mainNgAppFile } from './template-files/src/main';
import { polyfillFile } from './template-files/src/polyfills';
import { stylesFile } from './template-files/src/styles';
import { tsconfigFile } from './template-files/tsconfig.app';

export class NgAppTemplate implements ComponentTemplate {
  private constructor(
    readonly name = 'ng-app',
    readonly description = 'create an Angular application',
    readonly hidden = false
  ) {}

  generateFiles(context: ComponentContext) {
    return [
      docsFile(context),
      indexFile(context),
      ngAppFile(context),
      tsconfigFile(),
      indexHtmlFile(context),
      mainNgAppFile(context),
      polyfillFile(context),
      stylesFile(context),
      appComponentHtmlFile(context),
      appComponentScssFile(context),
      appComponentSpecFile(context),
      appComponentFile(context),
      appModuleFile(context),
      gitKeepFile(context),
      environmentProdFile(context),
      environmentFile(context),
    ];
  }

  static from(options: AngularComponentTemplateOptions) {
    return () =>
      new NgAppTemplate(
        options.name,
        options.description,
        options.hidden
      );
  }
}

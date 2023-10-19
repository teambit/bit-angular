import { AngularComponentTemplateOptions } from '@bitdev/angular.dev-services.common';
import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { indexFile } from './template-files';
import { docsFile } from './template-files/docs';
import { ngAppFile } from './template-files/ng-app';
import { appComponentFile } from './template-files/src/app/app.component';
import { appComponentHtmlFile } from './template-files/src/app/app.component-html';
import { appComponentScssFile } from './template-files/src/app/app.component-scss';
import { appComponentSpecFile } from './template-files/src/app/app.component-spec';
import { appConfigFile } from './template-files/src/app/app.config';
import { appModuleFile } from './template-files/src/app/app.module';
import { appRoutesFile } from './template-files/src/app/app.routes';
import { gitKeepFile } from './template-files/src/assets/gitkeep';
import { indexHtmlFile } from './template-files/src/index-html';
import { mainNgAppFile } from './template-files/src/main';
import { polyfillsFile } from './template-files/src/polyfills';
import { stylesFile } from './template-files/src/styles';
import { tsconfigFile } from './template-files/tsconfig.app';

export class NgAppTemplate implements ComponentTemplate {
  private constructor(
    readonly angularVersion: number,
    readonly name = 'ng-app',
    readonly description = 'create an Angular application',
    readonly hidden = false
  ) {
  }

  generateFiles(context: ComponentContext) {
    const files = [
      docsFile(context),
      indexFile(context),
      ngAppFile(context, this.angularVersion),
      tsconfigFile(this.angularVersion),
      indexHtmlFile(context),
      mainNgAppFile(this.angularVersion),
      stylesFile(),
      appComponentHtmlFile(),
      appComponentScssFile(),
      appComponentSpecFile(context, this.angularVersion),
      appComponentFile(context, this.angularVersion),
      gitKeepFile(),
    ];

    if (this.angularVersion < 15) {
      files.push(
        // starting from Angular 15, the `polyfills` option accept an array of module specifiers.
        // https://github.com/angular/angular-cli/commit/597bfea1b29cc7b25d1f466eb313cbeeb6dffc98
        polyfillsFile(),
      );
    }

    if (this.angularVersion >= 17) {
      files.push(
        appConfigFile(),
        appRoutesFile(),
      );
    } else {
      files.push(
        appModuleFile(),
      );
    }

    return files;
  }

  static from(options: AngularComponentTemplateOptions & { angularVersion: number }) {
    return () =>
      new NgAppTemplate(
        options.angularVersion,
        options.name,
        options.description,
        options.hidden
      );
  }
}

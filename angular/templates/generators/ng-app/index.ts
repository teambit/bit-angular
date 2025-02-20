import { AngularComponentTemplateOptions } from '@bitdev/angular.dev-services.common';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { Logger } from '@teambit/logger';
import { isCI } from 'std-env';
import { ngAppFile } from './template-files/bit-app';
import { docsFile } from './template-files/docs';
import { appComponentFile } from './template-files/src/app/app.component';
import { appComponentHtmlFile } from './template-files/src/app/app.component-html';
import { appComponentStyleSheetFile } from './template-files/src/app/app.component-scss';
import { appComponentSpecFile } from './template-files/src/app/app.component-spec';
import { appConfigFile } from './template-files/src/app/app.config';
import { serverConfigFile } from './template-files/src/app/app.config.server';
import { appModuleFile } from './template-files/src/app/app.module';
import { appRoutesFile } from './template-files/src/app/app.routes';
import { appRoutesServerFile } from "./template-files/src/app/app.routes.server";
import { gitKeepFile } from './template-files/src/assets/gitkeep';
import { indexHtmlFile } from './template-files/src/index-html';
import { mainNgAppFile } from './template-files/src/main';
import { mainServerFile } from './template-files/src/main.server';
import { serverFile } from './template-files/src/server';
import { helloApiFile } from './template-files/src/server/api/hello';
import { stylesFile } from './template-files/src/styles';
import { tsconfigFile } from './template-files/tsconfig.app';

export class NgAppTemplate implements ComponentTemplate {
  installMissingDependencies = true

  isApp = true;

  private constructor(
    private logger: Logger,
    readonly angularVersion: number,
    readonly name = 'ng-app',
    readonly description = 'create an Angular application',
    readonly hidden = false
  ) {
  }

  async prompt() {
    this.logger.off();

    const { confirm, group, select } = await import('@clack/prompts');

    const prompts: { [id: string]: () => Promise<any> } = {
      styleSheet: () => select({
        message: 'Which stylesheet format would you like to use?',
        options: [
          { label: 'CSS', value: 'css' },
          { label: 'SCSS', value: 'scss', hint: 'https://sass-lang.com/documentation/syntax#scss' },
          {
            label: 'Sass',
            value: 'sass',
            hint: 'https://sass-lang.com/documentation/syntax#the-indented-syntax'
          },
          { label: 'Less', value: 'less', hint: 'http://lesscss.org' }
        ]
      }) as Promise<string>
    };

    prompts.standalone = () => confirm({
      message: 'Do you want to use standalone components?'
    }) as Promise<boolean>;

    prompts.ssr = () => confirm({
      message: 'Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)?'
    }) as Promise<boolean>;

    const params = await group(prompts);

    this.logger.on();

    return params;
  }

  async generateFiles(context: ComponentContext) {
    let params: { [id: string]: any } = {
      styleSheet: 'scss',
      standalone: true,
      ssr: this.angularVersion >= 17
    };

    if (!isCI) {
      params = await this.prompt();
    }

    // const aspectId: ComponentID = typeof context.aspectId === 'string' ? ComponentID.fromString(context.aspectId) : context.aspectId;
    // const envId = aspectId.toStringWithoutVersion();
    // let envPkgName: string;
    // if (envId === 'bitdev.angular/angular-env') {
    //   envPkgName = '@bitdev/angular.angular-env';
    // } else {
    //   envPkgName = `@bitdev/angular.envs.angular-v${this.angularVersion}-env`;
    // }

    const files = [
      docsFile(context),
      ngAppFile(context, params.styleSheet, params.ssr, this.angularVersion),
      tsconfigFile(this.angularVersion, params.ssr),
      indexHtmlFile(context),
      mainNgAppFile(params.standalone),
      stylesFile(params.styleSheet),
      appComponentHtmlFile(),
      appComponentStyleSheetFile(params.styleSheet),
      appComponentSpecFile(context, params.standalone),
      appComponentFile(context, params.styleSheet, params.standalone),
      gitKeepFile(),
      appRoutesFile()
    ];

    if (params.ssr) {
      files.push(mainServerFile(params.standalone));

      if (this.angularVersion >= 19) {
        files.push(serverFile());
        files.push(appRoutesServerFile());
      } else {
        files.push(helloApiFile());
      }

      if (params.standalone) {
        files.push(serverConfigFile());
      }
    }

    if (params.standalone) {
      files.push(appConfigFile(params.ssr));
    }
    if (!params.standalone) {
      files.push(appModuleFile(params.ssr));
    }

    return files;
  }

  static from(options: AngularComponentTemplateOptions & {
    angularVersion: number
  }): EnvHandler<ComponentTemplate> {
    return (context: EnvContext) => {
      const name = options.name || 'ng-app-template';
      const logger = context.createLogger(name);
      return new NgAppTemplate(
        logger,
        options.angularVersion,
        options.name,
        options.description,
        options.hidden
      );
    };
  }
}

import { AngularComponentTemplateOptions, getWorkspace } from '@bitdev/angular.dev-services.common';
import { confirm, group, select } from '@clack/prompts';
import { ComponentID } from '@teambit/component';
import { EnvContext, EnvHandler } from '@teambit/envs';
import { ComponentContext, ComponentTemplate } from '@teambit/generator';
import { Logger } from '@teambit/logger';
import { PkgAspect, PkgMain } from '@teambit/pkg';
import { Workspace } from '@teambit/workspace';
import { isCI } from 'std-env';
import { indexFile } from './template-files';
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
import { gitKeepFile } from './template-files/src/assets/gitkeep';
import { indexHtmlFile } from './template-files/src/index-html';
import { mainNgAppFile } from './template-files/src/main';
import { mainServerFile } from './template-files/src/main.server';
import { polyfillsFile } from './template-files/src/polyfills';
import { helloApiFile } from './template-files/src/server/api/hello';
import { stylesFile } from './template-files/src/styles';
import { tsconfigFile } from './template-files/tsconfig.app';

export class NgAppTemplate implements ComponentTemplate {
  installMissingDependencies = true;
  isApp = true;

  private constructor(
    private logger: Logger,
    readonly angularVersion: number,
    readonly name = 'ng-app',
    readonly description = 'create an Angular application',
    readonly hidden = false,
    private pkg: PkgMain,
    private workspace: Workspace | undefined
  ) {
  }

  async prompt(context: ComponentContext) {
    this.logger.off();

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

    if (this.angularVersion > 13) {
      prompts.standalone = () => confirm({
        message: 'Do you want to use standalone components?'
      }) as Promise<boolean>;
    }

    if (this.angularVersion >= 16) {
      prompts.ssr = () => confirm({
        message: 'Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)?'
      }) as Promise<boolean>;
    }

    const params = await group(prompts);

    this.logger.on();

    return params;
  }

  async generateFiles(context: ComponentContext) {
    let params: { [id: string]: any } = {
      styleSheet: 'scss',
      standalone: this.angularVersion > 13,
      ssr: this.angularVersion >= 17
    };

    if (!isCI) {
      params = await this.prompt(context);
    }

    const aspectId: ComponentID = typeof context.aspectId === 'string' ? ComponentID.fromString(context.aspectId) : context.aspectId;
    const envId = aspectId.toStringWithoutVersion();
    let envPkgName: string;
    if (this.workspace) {
      const envComponent = await this.workspace!.get(aspectId);
      envPkgName = this.pkg.getPackageName(envComponent);
    } else if (envId === 'bitdev.angular/angular-env') { // mostly for ci / ripple
      envPkgName = '@bitdev/angular.angular-env';
    } else {
      envPkgName = `@bitdev/angular.envs.angular-v${ this.angularVersion }-env`;
    }

    const files = [
      docsFile(context),
      indexFile(context),
      ngAppFile(context, params.styleSheet, params.ssr, envPkgName),
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
      files.push(
        mainServerFile(params.standalone),
        helloApiFile()
      );

      if (params.standalone) {
        files.push(serverConfigFile());
      }
    }

    if (this.angularVersion < 15) {
      files.push(
        // starting from Angular 15, the `polyfills` option accept an array of module specifiers.
        // https://github.com/angular/angular-cli/commit/597bfea1b29cc7b25d1f466eb313cbeeb6dffc98
        polyfillsFile()
      );
    }

    if (params.standalone) {
      files.push(appConfigFile(this.angularVersion, params.ssr));
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
      const pkg = context.getAspect<PkgMain>(PkgAspect.id);
      const workspace = getWorkspace(context);
      return new NgAppTemplate(
        logger,
        options.angularVersion,
        options.name,
        options.description,
        options.hidden,
        pkg,
        workspace
      );
    };
  }
}

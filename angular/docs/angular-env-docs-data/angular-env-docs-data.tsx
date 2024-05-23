import { EnvDocsData, ComponentName } from '@teambit/envs.docs.env-docs-data';

export const angularEnvDocsData = EnvDocsData.from(
  {
    envcomponentname: new ComponentName(
      'angular-env',
      'bitdev',
      'angular'
    ),
    envnamepascal: 'Angular',
    envurl: 'https://bit.cloud/bitdev/angular/angular-env',
    envdeps: {
      peers: [{
        'name': '@angular/core',
        'version': '18.0.0',
        'supportedRange': '^18.0.0'
      }],
      dev: [{
        'name': '@angular/cli',
        'version': '18.0.0'
      }]
    },
    filesuffixes: { mainFile: 'ts', docsFile: 'mdx', compositionFile: 'ts', testFile: 'ts', indexFile: 'ts' },
    envtemplates: { env: 'ng-env', component: 'ng-standalone', module: 'ng-module', app: 'ng-app' },
    envstarters: { workspace: 'angular' },
    envtemplatescomponentname: new ComponentName(
      'templates/generators',
      'bitdev',
      'angular'
    ),
    envstarterscomponentname: new ComponentName(
      'templates/starters',
      'bitdev',
      'angular'
    ),
    exampleNames: { component: 'ui/my-button' }
  }
)

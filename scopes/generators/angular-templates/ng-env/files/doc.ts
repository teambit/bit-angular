import { ComponentContext } from '@teambit/generator';

export function docFile({ namePascalCase: Name }: ComponentContext, angularVersion: number, envId: string) {
  // language=Markdown
  return `---
description: A Bit development environment for Angular Components
labels: ['angular', 'environment', 'env', 'aspect', 'extension']
---

import { EnvOverview } from '@teambit/envs.docs.env-overview-template';

<EnvOverview
  description='This env provides a development environment for Angular apps & components.'
logo={{
  name: 'Angular',
    icon: 'https://static.bit.dev/brands/logo-angular.svg',
    background: '#0d47a1'
}}
envId='${envId}'
docsLink='https://bit.dev/docs/angular-introduction'
isExtension
tools={{
  developmentTools: [
    {
      name: 'Jest',
      configFiles: [
        'https://bit.cloud/teambit/angular/versions/angular-v${angularVersion}/~code/jest/jest.config.ts',
      ],
    },
    {
      name: 'ESLint',
      configFiles: [
        'https://bit.cloud/teambit/angular/versions/common/angular-base/~code/config/eslintrc.js',
      ],
    },
    {
      name: 'Prettier',
      configFiles: [
        'https://bit.cloud/teambit/angular/versions/common/angular-base/~code/config/prettier.config.js',
      ],
    },
  ],
    buildPipeline: [
    {
      name: 'Ng-Packagr',
      toolLink: 'https://bit.cloud/teambit/angular/dev-services/compiler/ng-packagr',
      configFiles: [
      ],
    },
    {
      name: 'ESLint',
      configFiles: [
        'https://bit.cloud/teambit/angular/versions/common/angular-base/~code/config/eslintrc.js',
      ],
    },
    {
      name: 'Jest',
      configFiles: [
        'https://bit.cloud/teambit/angular/versions/angular-v${angularVersion}/~code/jest/jest.config.ts',
      ],
    },
  ],
    previewsAndDocs: [
    {
      name: 'Component Preview',
      toolLink: 'https://bit.cloud/teambit/angular/dev-services/preview/mounter',
      configFiles: [
        'https://bit.cloud/teambit/angular/versions/common/angular-base/~code/preview/mounter.ts',
        'https://bit.cloud/teambit/angular/versions/common/angular-base/~code/preview/host-dependencies.ts',
      ],
    },
    {
      name: 'Component Docs',
      toolLink: 'https://bit.cloud/teambit/angular/dev-services/preview/preview',
      configFiles: [
        'https://bit.cloud/teambit/angular/dev-services/preview/preview/~code/docs.ts',
      ],
    },
    {
      name: 'Webpack',
      configFiles: [
      ],
    },
    {
      name: 'Webpack Dev Server',
      configFiles: [
      ],
    },
  ],
}} />`
}

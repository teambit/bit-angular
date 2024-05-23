import React from 'react';
import { lazy } from '@loadable/component';
import type { DocsRoute } from '@teambit/docs.entities.docs-routes';
import { angularEnvDocsData } from '@bitdev/angular.docs.angular-env-docs-data';

/** Overview */
const BitAngularIntroduction = lazy(
  () => import('@bitdev/angular.docs.bit-angular-introduction')
);

/** Dev Environment  */
// const CreateCustomEnv = lazy(
//   () => import('@bitdev/angular.docs.create-custom-env')
// );
const CreateEnv = lazy(() => import('@teambit/envs.docs.create-env'));
const AngularVersions = lazy(
  () => import('@bitdev/angular.docs.angular-versions')
);
// const DevelopmentTools = lazy(
//   () => import('@bitdev/angular.docs.development-tools')
// );
// const DependencyPolicy = lazy(
//   () => import('@bitdev/angular.docs.dependency-policy')
// );
const EnvDependencies = lazy(
  () => import('@teambit/envs.docs.envs-dependency-policy')
);
const ComponentsPreview = lazy(
  () => import('@bitdev/angular.docs.components-preview')
);
// const ComponentsDocumentation = lazy(
//   () => import('@bitdev/angular.docs.components-documentation')
// );
const AngularPipeline = lazy(
  () => import('@bitdev/angular.docs.build-pipelines')
);
const EnvsBuildPipelines = lazy(
  () => import('@teambit/envs.docs.envs-build-pipeline')
);

// const WorkspaceStarters = lazy(
//   () => import('@bitdev/angular.docs.workspace-starters')
// );
// const ComponentGenerators = lazy(
//   () => import('@bitdev/angular.docs.component-generators')
// );
const EnvsComponentGenerators = lazy(
  () => import('@teambit/envs.docs.envs-component-generators')
);
const EnvsWorkspaceStarters = lazy(
  () => import('@teambit/envs.docs.envs-workspace-starters')
);

/** Bit Components */
const ComponentsOverview = lazy(
  () => import('@bitdev/angular.docs.components-overview')
);

/** Angular Apps */
const CreateNgApp = lazy(() => import('@bitdev/angular.docs.create-ng-app'));
const AppBuild = lazy(() => import('@bitdev/angular.docs.ng-app-build'));
const AppDeploy = lazy(() => import('@bitdev/angular.docs.ng-app-deploy'));

/* Design */
const DesignOverview = lazy(
  () => import('@bitdev/angular.docs.ng-design-overview')
);
const Theming = lazy(() => import('@bitdev/angular.docs.ng-theming'));
const BaseComponents = lazy(
  () => import('@bitdev/angular.docs.ng-base-components')
);
const ComponentLibs = lazy(
  () => import('@bitdev/angular.docs.ng-component-libraries')
);

export const angularRouteBase = 'angular-env';

export const learnAngular: DocsRoute[] = [
  {
    path: 'angular-introduction',
    title: 'Introduction to Angular',
    component: <BitAngularIntroduction />,
    componentId: 'bitdev.angular/docs/bit-angular-introduction',
  },
  {
    path: 'angular-components',
    title: 'Components',
    icon: 'components',
    children: [
      {
        path: 'components-overview',
        title: 'Overview',
        description: 'Create Angular components with Bit',
        component: <ComponentsOverview />,
        componentId: 'bitdev.angular/docs/components-overview',
      },
    ],
  },
  {
    path: 'angular-apps',
    title: 'Apps',
    icon: 'app',
    children: [
      {
        path: 'create-ng-app',
        title: 'Create an app',
        description: 'Learn how to create an Angular app component',
        component: <CreateNgApp />,
        componentId: 'bitdev.angular/docs/create-ng-app',
      },
      {
        path: 'app-build',
        title: 'App build',
        description: 'Learn how to build an Angular app component',
        component: <AppBuild />,
        componentId: 'bitdev.angular/docs/ng-app-build',
      },
      {
        path: 'app-deployment',
        title: 'App deployment',
        description: 'Learn how to deploy an Angular app component',
        component: <AppDeploy />,
        componentId: 'bitdev.angular/docs/ng-app-deploy',
      },
    ],
  },
  {
    path: `${angularRouteBase}-env`,
    title: 'Dev environment',
    icon: 'env',
    children: [
      // {
      //   path: 'use-custom-env',
      //   title: 'Set up your environment',
      //   description: 'Create a new Angular development environment',
      //   component: <CreateCustomEnv />,
      //   componentId: 'bitdev.angular/docs/create-custom-env',
      // },
      {
        path: 'set-up-your-env',
        title: 'Set up your env',
        description: 'Create a new Angular development environment',
        // @ts-ignore
        component: <CreateEnv {...angularEnvDocsData} additionalEnvInformation={<AngularVersions/>} routeBase={angularRouteBase}/>,
        // component: <CreateEnv {...angularEnvDocsData} routeBase={angularRouteBase} additionalEnvInformation={angularAdditionalInformation} envTemplate={NgEnvTemplate}/>,
        componentId: 'teambit.envs/docs/create-env',
      },
      // {
      //   path: 'angular-versions',
      //   title: 'Angular versions',
      //   description:
      //     'Update the Angular version of your development environment',
      //   component: <AngularVersions />,
      //   componentId: 'bitdev.angular/docs/angular-versions',
      // },
      // {
      //   path: 'development-tools',
      //   title: 'Development tools',
      //   description:
      //     'Configure your Angular dev tools with compiler, tester, linter, and more',
      //   component: <DevelopmentTools />,
      //   componentId: 'bitdev.angular/docs/development-tools',
      // },
      {
        path: 'dependencies',
        title: 'Dependencies',
        description:
          'Set peer dependencies, and standardize your Angular component dependencies',
        // @ts-ignore
        component: <EnvDependencies {...angularEnvDocsData} />,
        componentId: 'teambit.envs/docs/envs-dependency-policy',
      },
      // {
      //   path: 'build-pipelines',
      //   title: 'Build pipelines',
      //   description: 'Configure the build pipelines for Angular components',
      //   component: <BuildPipelines />,
      //   componentId: 'bitdev.angular/docs/build-pipelines',
      // },
      {
        path: 'build-pipelines',
        title: 'Build pipelines',
        description: 'Configure the build pipelines for Lit components',
        // @ts-ignore
        component: <EnvsBuildPipelines {...angularEnvDocsData} />,
        componentId: 'teambit.envs/docs/envs-build-pipeline',
      },
      {
        path: 'components-preview',
        title: 'Components preview',
        description: 'Configure your Angular components isolated preview',
        component: <ComponentsPreview />,
        componentId: 'bitdev.angular/docs/components-preview',
      },
      // {
      //   path: 'components-docs',
      //   title: 'Components docs',
      //   description: 'Configure the docs for Angular components',
      //   component: <ComponentsDocumentation />,
      //   componentId: 'bitdev.angular/docs/components-documentation',
      // },
      {
        path: 'generators',
        title: 'Component generators',
        description: 'Configure the component generators for Angular components',
        // @ts-ignore
        component: <EnvsComponentGenerators {...angularEnvDocsData} />,
        componentId: 'teambit.envs/docs/envs-component-generators',
      },
      {
        path: 'starters',
        title: 'Workspace starters',
        description: 'Configure the workspace starters for your Angular components',
        // @ts-ignore
        component: <EnvsWorkspaceStarters {...angularEnvDocsData} />,
        componentId: 'teambit.envs/docs/envs-workspace-starters',
      },
      // {
      //   path: 'workspace-starters',
      //   title: 'Workspace starters',
      //   description:
      //     'Configure the workspace starters for your Angular components',
      //   component: <WorkspaceStarters />,
      //   componentId: 'bitdev.angular/docs/workspace-starters',
      // },
      // {
      //   path: 'component-generators',
      //   title: 'Component generators',
      //   description:
      //     'Configure the component generators for Angular components',
      //   component: <ComponentGenerators />,
      //   componentId: 'bitdev.angular/docs/component-generators',
      // },
    ],
  },
  {
    path: 'angular-design',
    title: 'Design',
    icon: 'formatting',
    open: false,
    children: [
      {
        path: 'overview',
        title: 'Design overview',
        component: <DesignOverview />,
      },
      {
        path: 'theming',
        title: 'Theming',
        component: <Theming />,
      },
      {
        path: 'base-components',
        title: 'Base components',
        component: <BaseComponents />,
      },
      {
        path: 'component-libs',
        title: 'Component libraries',
        component: <ComponentLibs />,
      },
    ],
  }
];

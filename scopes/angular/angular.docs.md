---
description: A development environment for Angular Components
labels: ['angular', 'environment', 'env', 'aspect', 'extension']
---

# Angular Overview
`teambit.angular/angular` is a pre-built [Env](https://bit.dev/docs/envs/envs-overview) for building components and apps with Angular.
It enables you to quickly set up a dev environment that follows best practices for Angular component development.

## Using the Angular env
### In a new workspace
To use the Angular Env, the easiest way is to create a new pre-configured workspace with the workspace generator:
```bash
bit new ng-workspace <workspace-name> -a teambit.angular/angular
```

Change directory to the newly created workspace
```bash
cd <workspace-name>
```

Create a bit component:
```bash
bit create ng-module ui/my-button
```

Install dependencies:
```bash
bit install
```

Start the dev server
```bash
bit start
```

Open-up your browser on localhost:3000, or any other available port, and display your workspace with your components.

### In an existing Bit workspace
First you need to make sure that you're using yarn (in your workspace.jsonc, search for `packageManager` and replace `pnpm` by `yarn` if needed),
then add the Angular env to your workspace.jsonc with the following command:

```bash
bit use teambit.angular/angular
```

You can now create a new component that uses the Angular env:
```bash
bit create ng-module <component-name> --env teambit.angular/angular
```

And finally you need to install the dependencies:
```bash
bit install
```

## Creating Components
The Angular env provides a set of component templates that can be used to speed up and standardize your component development:

To list all available templates, use the following command:
```bash
bit templates
```

- `ng-module` a generic Angular module.
- `ng-env` boilerplate for a customized environment configuration.
- `ng-app` an Angular application.

Use any of these templates with the `bit create` command:
```bash
bit create <template-name> <component-name> --env teambit.angular/angular
```

## Angular versions
The Angular env (teambit.angular/angular) uses the latest stable version of Angular and its dependencies.
Whenever a new major version of Angular is released, a new major version of the Angular env is created.

If you want to use a specific version of Angular, you can use one those env versions instead of `teambit.angular/angular`:
- [v8: `teambit.angular/versions/angular-v8`](https://bit.cloud/teambit/angular/versions/angular-v8)
- [v9: `teambit.angular/versions/angular-v9`](https://bit.cloud/teambit/angular/versions/angular-v9)
- [v10: `teambit.angular/versions/angular-v10`](https://bit.cloud/teambit/angular/versions/angular-v10)
- [v11: `teambit.angular/versions/angular-v11`](https://bit.cloud/teambit/angular/versions/angular-v11)
- [v12: `teambit.angular/versions/angular-v12`](https://bit.cloud/teambit/angular/versions/angular-v12)
- [v13: `teambit.angular/versions/angular-v13`](https://bit.cloud/teambit/angular/versions/angular-v13)
- [v14: `teambit.angular/versions/angular-v14`](https://bit.cloud/teambit/angular/versions/angular-v14)
- [v15: `teambit.angular/versions/angular-v15`](https://bit.cloud/teambit/angular/versions/angular-v15)

You can quickly switch between these versions with the `bit env set` command. For example to use v14 instead of the default, you would use the following command:
```bash
bit env replace teambit.angular/angular teambit.angular/angular-v14
```

## Angular applications
You can use the Angular env to create an Angular application with the following command:
```bash
bit create ng-app <app-name> --env teambit.angular/angular
```

To run your application in dev mode, use the following command:
```bash
bit run <app-name>
```

### Configure your application
Your app component can be configured with different options for serve, build and deployment.
Open the configuration file named `<app-name>.ng-app.ts` that is located in your app folder.

You can change the default configuration by editing the different options, such as app name, port, source folder, serve, build, deploy options, etc.
See the [apps documentation](https://bit.dev/docs/apps/apps-overview) for more information.

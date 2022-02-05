<h1 align="center">Bit Angular</h1>
<p align="center">
  <img src="https://storage.googleapis.com/static.bit.dev/harmony-docs/readme-logo%20(2).png"/>
</p>

<p align="center">
  <a href="https://harmony-docs.bit.dev/">Documentation</a> |
  <a href="https://bit.dev/">Platform</a> |
  <a href="https://www.youtube.com/channel/UCuNkM3qIO79Q3-VrkcDiXfw">Learn</a>
</p>

<h3 align="center">
  Build components first.
</h3>

<p align="center">
Open infrastructure for component-driven applications to speed and scale development.
</p>

<p align="center">
<a href="https://opensource.org/licenses/Apache-2.0"><img alt="apache" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
<a href="https://github.com/teambit/bit/blob/master/CONTRIBUTING.md"><img alt="prs" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
<img alt="status" src="https://github.com/teambit/bit-angular/workflows/CI/badge.svg">
<a href="https://join.slack.com/t/bit-dev-community/shared_invite/zt-o2tim18y-UzwOCFdTafmFKEqm2tXE4w" ><img alt="Join Slack" src="https://img.shields.io/badge/Slack-Join%20Bit%20Slack-blueviolet"/></a>


## What is Bit Angular?

Bit Angular is a development environment for Bit Harmony.


### How to Start?

To get started install [Bit Version Manager](https://harmony-docs.bit.dev/getting-started/installing-bit):

```bash
npm i -g @teambit/bvm
# or
yarn global add @teambit/bvm
```
Install Bit:

```bash
bvm install
```

Create a new workspace
```bash
bit new ng-workspace <workspace-name> -a teambit.angular/angular-v13
```
You can replace `v13` by the version that you want to use (starting from `v8`).

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

### Use the Angular environment in an existing Bit workspace
First you need to get the latest version of the Angular environment that you want to use by running this command:

```bash
npm dist-tag ls @teambit/angular-v13
```
You can replace `v13` by the version that you want to use (starting from `v8`).

Then in your `workspace.jsonc` configuration file, add the following lines and replace `x.x.x` by the version number retrieved with the previous command:
```
{  
  // ...
  // Update the dependencies to include angular
  "teambit.dependencies/dependency-resolver": {
    /**
      * choose the package manager for Bit to use. you can choose between 'yarn', 'pnpm'
      */
    "packageManager": "teambit.dependencies/pnpm",
    "policy": {
      "dependencies": {
        // ...
        // Replace `v13` by the version of Angular that you want to use
        "@teambit/angular-v13": "x.x.x"
      },
      "peerDependencies": {}
    },
    "nodeLinker": "hoisted"
  },
  // Load the angular-v13 environment into the workspace
  "teambit.angular/angular-v13@x.x.x": {},
  "teambit.workspace/variants": {
    // Use the angular-v13 environment for all components, or specify a pattern to use it just for some components
    "*": {
      // Replace `v13` by the version of Angular that you want to use
      "teambit.angular/angular-v13@x.x.x": {}
    }
  },
  // Add Angular component generators to the list of available component templates
  "teambit.generator/generator": {
    "aspects": [
      // Replace `v13` by the version of Angular that you want to use
      "teambit.angular/angular-v13"
    ]
  },
  // ...
}
```

Install dependencies:

```bash
bit install
```

### Resources & Community

- [Videos](https://www.youtube.com/c/Bitdev/videos)
- [Conference talks](https://harmony-docs.bit.dev/resources/interviews)
- [Interviews](https://harmony-docs.bit.dev/resources/interviews)
- [Podcasts](https://harmony-docs.bit.dev/resources/podcasts)
- [Live streams](https://harmony-docs.bit.dev/resources/live-streams)
- [Articles](https://harmony-docs.bit.dev/resources/articles)
- [Community](https://harmony-docs.bit.dev/resources/community)


## Contributing 🎗️

Contributions are always welcome, no matter how large or small. Before contributing, please read the [code of conduct](https://github.com/teambit/bit/blob/master/CODE_OF_CONDUCT.md).

See [Contributing](https://github.com/teambit/bit/blob/master/CONTRIBUTING.md).

## License 💮

Apache License, Version 2.0
![Analytics](https://ga-beacon.appspot.com/UA-96032224-1/bit/readme)





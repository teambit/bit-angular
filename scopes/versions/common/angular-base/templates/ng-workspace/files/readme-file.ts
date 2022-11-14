import { WorkspaceContext } from '@teambit/generator';

export function readme({ aspectComponent }: WorkspaceContext) {
  return `# Welcome to your Bit Workspace

To get started straight away you can create a bit component, for example:

\`\`\`bash
bit create ng-lib ui/my-button --env ${aspectComponent!.id.toStringWithoutVersion()}
\`\`\`

Then you need to install the dependencies for the generated component:

\`\`\`bash
bit install
\`\`\`

And finally start the dev server

\`\`\`bash
bit start
\`\`\`

Open-up your browser on localhost:3000, or any other available port, and display your workspace with your components.
It may take a while to build the first time you run this command as it is building the whole user interface for your development environment.

## What's included

- **workspace.jsonc**

This is the main configuration file of your bit workspace. Here you can modify the workspace name and icon as well as default directory and scope.
It is where dependencies are found when you install anything.
It is also where you register aspects, bit extensions as well as apply the environments for your components.
This workspace has been setup so that all components use the Angular env. However you can create other components and apply other envs to them such as node, html, react and aspect envs.

- **.bitmap**

This is an auto-generated file and includes the mapping of your components.


- **.gitignore**

Ignoring any files from version control
`;
}

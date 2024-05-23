import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';
import {
  Terminal,
  Green,
  Neutral,
  Blue,
} from '@teambit/community.ui.bit-cli.terminal';

export const BitTemplates = () => (
  <CommandExample commandName="templates" commandExample={{}} />
);

export const BitTemplatesOutput = () => (
  <Terminal isOutput>
    <Green
      br
    >{`The following template(s) are available with the command bit create:  
Example - bit create <template-name> <component-name>`}</Green>
    <br />
    <Blue bold br>
      angular (bitdev.angular/angular-env)
    </Blue>
    <Neutral br> ng-module (create a generic Angular module)</Neutral>
    <Neutral br> ng-env (customize the base Angular env with your configs and tools)</Neutral>
    <Neutral br> ng-app (create an Angular application)</Neutral>
  </Terminal>
);

export const CreateComponent = () => {
  const values = {
    'template-name': 'ng-module',
    'component-names...': 'ui/my-button',
  };

  return <CommandExample commandName="create" commandExample={values} />;
};

export const GeneratedFiles = () => (
  <Terminal isOutput>{`.
└── use-counter
    ├── my-button.component.ts
    ├── my-button.component.scss
    ├── my-button.composition.ts
    ├── my-button.docs.md
    ├── my-button.module.ts
    ├── my-button.spec.ts
    └── public-api.ts`}</Terminal>
);

export const BitShow = () => {
  const values = {
    'component-name': 'ui/my-button',
  };
  return <CommandsExplorer commandName="show" commandExample={values} />;
};

export const ShowComponentOutput = () => (
  <Terminal
    isOutput
  >{`┌──────────────────┬─────────────────────────────────────────────────────────────┐
│ id               │ my-org.my-scope/ui/my-button                                │
├──────────────────┼─────────────────────────────────────────────────────────────┤
│ env              │ bitdev.angular/angular-env                                     │
├──────────────────┼─────────────────────────────────────────────────────────────┤
│ dev dependencies │ @bitdev/angular.angular-env@latest-----(component)                     │
└──────────────────┴─────────────────────────────────────────────────────────────┘`}</Terminal>
);

export const InstallGenerator = () => {
  const values = {
    'packages...': '@bitdev/angular.templates.generators',
  };
  return <CommandsExplorer commandName="install" commandExample={values} />;
};

export const ForkGenerator = () => {
  const values = {
    'source-component-id': 'bitdev.angular/templates/generators',
    'target-component-name': 'templates/my-angular-generators',
  };
  return <CommandsExplorer commandName="fork" commandExample={values} />;
};

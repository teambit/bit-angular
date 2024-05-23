/* eslint-disable */
import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';
import {
  Terminal,
  Neutral,
  Blue,
  Green,
} from '@teambit/community.ui.bit-cli.terminal';

export const NewWorkspace = () => {
  const example = {
    'template-name': 'angular',
    'workspace-name': 'my-workspace',
    'env': 'bitdev.angular/angular-env',
  };
  return <CommandsExplorer commandName="new" commandExample={example} />;
};

export const CreateEnv = () => {
  const example = {
    'template-name': 'ng-env',
    'component-names...': 'envs/my-angular-env'
  };
  return <CommandsExplorer commandName="create" commandExample={example} />;
};

export const BitEnvs = () => {
  return <CommandsExplorer commandName="envs" commandExample={{}} />;
};

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
      My-Angular-Env (my-org.my-scope/envs/my-angular-env)
    </Blue>
    <Neutral br> ng-module</Neutral>
    <Neutral br> ng-env</Neutral>
    <Neutral br> ng-app</Neutral>
  </Terminal>
);

export const CreateComponent = () => {
  const values = {
    'template-name': 'ng-module',
    'component-names...': 'ui/my-button',
  };

  return <CommandExample commandName="create" commandExample={values} />;
};

export const EnvsOutputComponent = () => (
  <Terminal isOutput>
    <Neutral br>
      ┌─────────────────────────────────────┬─────────────────────────────────────┐
    </Neutral>
    <Neutral br>
      {`│ `}
      <Blue>component</Blue>
      <Neutral>{`                           │ `}</Neutral>
      <Blue>env</Blue>
      <Neutral>{`                                 │`}</Neutral>
    </Neutral>
    <Neutral br>
      ├─────────────────────────────────────┼─────────────────────────────────────┤
    </Neutral>
    <Neutral
      br
    >{`│ my-org.my-scope/envs/my-angular-env │ teambit.envs/env                    │`}</Neutral>
    <Neutral br>
      ├─────────────────────────────────────┼─────────────────────────────────────┤
    </Neutral>
    <Neutral
      br
    >{`│ my-org.my-scope/ui/my-button        │ my-org.my-scope/envs/my-angular-env │`}</Neutral>
    <Neutral>
      └─────────────────────────────────────┴─────────────────────────────────────┘
    </Neutral>
  </Terminal>
);

export const SetEnv = () => {
  const example = {
    'component-pattern': 'ui/my-button',
    env: 'my-org.my-scope/envs/my-angular-env',
  };
  return (
    <CommandExample
      commandName="envs"
      subCommandName="set"
      commandExample={example}
    />
  );
};

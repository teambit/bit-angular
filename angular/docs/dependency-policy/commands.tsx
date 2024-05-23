import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';
import { Terminal } from '@teambit/community.ui.bit-cli.terminal';

export const ShowEnv = () => {
  const values = {
    'component-name': 'envs/my-angular-env',
  };
  return <CommandsExplorer commandName="show" commandExample={values} />;
};

export const ShowComponent = () => {
  const values = {
    'component-name': 'ui/my-button',
  };
  return <CommandsExplorer commandName="show" commandExample={values} />;
};

export const ShowEnvOutput = () => (
  <Terminal
    isOutput
  >{`┌──────────────────┬───────────────────────────────────────┐
│ id               │ my-org.my-scope/envs/my-angular-env   │
├──────────────────┼───────────────────────────────────────┤
│ env              │ teambit.envs/env                      │
├──────────────────┼───────────────────────────────────────┤
│ dependencies     │ @angular/forms@^15.0.0----- (package) │
└──────────────────┴───────────────────────────────────────┘`}</Terminal>
);

export const BitInstall = () => {
  return <CommandExample commandName="install" commandExample={{}} />;
};

export const ShowComponentPeerOutput = () => (
  <Terminal
    isOutput
  >{`┌────────────────────┬─────────────────────────────────────────────────────────────┐
│ id                 │ my-org.my-scope/ui/my-button                                   │
├────────────────────┼─────────────────────────────────────────────────────────────┤
│ env                │ my-org.my-scope/envs/my-angular-env                         │
├────────────────────┼─────────────────────────────────────────────────────────────┤
│ peer dependencies  │ @angular/forms@^13.0.0 || ^14.0.0 || ^15.0.0----- (package) │
└────────────────────┴─────────────────────────────────────────────────────────────┘`}</Terminal>
);

export const BitShowDevOutput = () => (
  <Terminal isOutput>
    {`┌───────────────────┬─────────────────────────────────────────────────────────────┐
│ id                │ my-scope/ui/my-button                                          │
├───────────────────┼─────────────────────────────────────────────────────────────┤
│ env               │ my-org.my-scope/envs/my-angular-env                         │
├───────────────────┼─────────────────────────────────────────────────────────────┤
│ dev files         │ welcome.dev.ts (@my-org/my-scope.envs.my-angular-env)       │
├───────────────────┼─────────────────────────────────────────────────────────────┤
│ dev dependencies  │ @my-org/my-scope.envs.my-angular-env (component)            │
│                   │ lodash@^2.3.2----- (package)                                │
└───────────────────┴─────────────────────────────────────────────────────────────┘`}
  </Terminal>
);

export const DepsSet = () => {
  const values = {
    'component-pattern': 'ui/my-button',
    'package...': '"@angular/material@15.0.0"',
  };
  return (
    <CommandExample
      commandName="deps"
      subCommandName="set"
      commandExample={values}
    />
  );
};

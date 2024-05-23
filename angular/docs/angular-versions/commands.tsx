import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';
import { Terminal } from '@teambit/community.ui.bit-cli.terminal';

export const ReplaceEnv = () => {
  const example = {
    'current-env': 'bitdev.angular/angular-env',
    'new-env': 'bitdev.angular/envs/angular-v16-env',
  };
  return (
    <CommandExample
      commandName="envs"
      subCommandName="replace"
      commandExample={example}
    />
  );
};

export const ShowComponent = () => {
  const values = {
    'component-name': 'ui/my-button',
  };
  return <CommandsExplorer commandName="show" commandExample={values} />;
};

export const ShowComponentOutput = () => (
  <Terminal
    isOutput
  >{`┌───────────────────┬──────────────────────────────────────────────────────────────┐
│ id                │ my-org.my-scope/ui/my-button                                    │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ env               │ my-org.my-scope/envs/my-angular-env                          │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ dependencies      │ tslib@^2.3.0- (package)                                      │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ dev dependencies  │ @angular/compiler@^15.0.0---------- (package)                │
│                   │ @angular/compiler-cli@^15.0.0------ (package)                │
│                   │ @types/jest@^29.2.4---------------- (package)                │
│                   │ @types/node@^14.15.0--------------- (package)                │
│                   │ jest@^29.3.1----------------------- (package)                │
│                   │ jest-preset-angular@~12.2.3-------- (package)                │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ peer dependencies │ @angular/common@^15.0.0------------------- (package)         │
│                   │ @angular/core@^15.0.0--------------------- (package)         │
│                   │ @angular/platform-browser@^15.0.0--------- (package)         │
│                   │ @angular/platform-browser-dynamic@^15.0.0- (package)         │
│                   │ rxjs@~7.5.7------------------------------- (package)         │
│                   │ typescript@~4.8.2------------------------- (package)         │
│                   │ zone.js@~0.12.0--------------------------- (package)         │
└───────────────────┴──────────────────────────────────────────────────────────────┘`}</Terminal>
);

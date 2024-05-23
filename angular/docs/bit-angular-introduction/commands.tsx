import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';

export const BitNew = () => {
  const values = {
    'template-name': 'hello-world-angular',
    env: 'teambit.community/starters/hello-world-angular',
    'workspace-name': 'my-hello-world-angular',
  };

  return <CommandsExplorer commandName="new" commandExample={values} />
};

export const BitNewEmpty = () => {
  const values = {
    'template-name': 'angular',
    env: 'bitdev.angular/angular-env',
    'workspace-name': 'my-angular-workspace'
  };

  return <CommandsExplorer commandName="new" commandExample={values} />
};
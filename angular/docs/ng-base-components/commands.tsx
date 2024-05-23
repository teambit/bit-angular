import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';

export const CreateButtonComponent = () => {
  const values = {
    'template-name': 'ng-module',
    'component-names...': 'ui/button',
  };
  return <CommandsExplorer commandName="create" commandExample={values} />;
};

import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import React from 'react';

export const CreateDesignSystemWS = () => {
  const example = {
    'template-name': 'design-system',
    'default-scope': 'my-org.my-scope',
    'workspace-name': 'my-design-system',
    aspect: 'bitdev.angular/angular-env',
  };
  return <CommandsExplorer commandName="new" commandExample={example} />;
};

export const CreateMaterialDesignSystemWS = () => {
  const example = {
    'template-name': 'material-design-system',
    'default-scope': 'my-org.my-scope',
    'workspace-name': 'my-material-design-system',
    aspect: 'bitdev.angular/angular-env',
  };
  return <CommandsExplorer commandName="new" commandExample={example} />;
};

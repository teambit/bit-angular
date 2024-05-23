import React from 'react';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';

export const CreateComponent = () => {
  const values = {
    'template-name': 'ng-module',
    'component-names...': 'ui/my-button',
  };

  return <CommandExample commandName="create" commandExample={values} />;
};

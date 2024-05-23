import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import React from 'react';

export const CreateBaseThemeComponent = () => {
  const values = {
    'template-name': 'scss',
    'component-names...': 'theme/my-base-theme',
    'aspect': 'teambit.html/html-env'
  };
  return <CommandsExplorer commandName="create" commandExample={values} />;
};

export const CreateCustomThemeComponent = () => {
  const values = {
    'template-name': 'scss',
    'component-names...': 'theme/my-dark-theme',
  };
  return <CommandsExplorer commandName="create" commandExample={ values }/>
};

import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';

export const RemoveEnv = () => {
  const values = {
    'component-pattern': 'envs/my-angular-env',
    force: true,
  };
  return <CommandsExplorer commandName="remove" commandExample={values} />;
};

export const NewWorkspace = () => {
  const example = {
    'template-name': 'angular',
    'default-scope': 'my-org.my-scope',
    'workspace-name': 'my-workspace',
    'env': 'bitdev.angular/angular-env'
  };
  return <CommandsExplorer commandName="new" commandExample={example} />;
};

export const ForkStarter = () => {
  const values = {
    'source-component-id': 'bitdev.angular/templates/starters',
    'target-component-name': 'templates/my-angular-starter',
  };
  return <CommandsExplorer commandName="fork" commandExample={values} />;
};

export const InstallStarter = () => {
  const values = {
    'packages...': '@bitdev/angular.templates.starters',
  };
  return <CommandsExplorer commandName="install" commandExample={values} />;
};

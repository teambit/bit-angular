import React from 'react';
import { CommandsProvider } from '@teambit/community.ui.bit-cli.commands-provider';
import commands from '@teambit/harmony.content.cli-reference';
import { NgDesignOverview } from './index';

export const BasicVueDesignOverview = () => (
  <CommandsProvider rawCommands={commands}>
    <NgDesignOverview />
  </CommandsProvider>
);

import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';
import {
  Terminal,
  Neutral,
  Green,
  Blue,
} from '@teambit/community.ui.bit-cli.terminal';

export const BitBuild = () => {
  return <CommandExample commandName="build" commandExample={{}} />;
};

export const BitSnap = () => {
  return <CommandExample commandName="snap" commandExample={{}} />;
};

export const BitTag = () => {
  return <CommandExample commandName="tag" commandExample={{}} />;
};

export const ListTasks = () => {
  const values = {
    'component-name': 'ui/my-button',
    services: 'teambit.pipelines/builder',
  };
  return (
    <CommandsExplorer
      commandName="envs"
      subCommandName="get"
      commandExample={values}
    />
  );
};

export const ListTasksOutput = () => (
  <Terminal isOutput>
    <Neutral bold br>
      Environment: my-org.my-scope/envs/my-angular-env
    </Neutral>
    <Blue bold br>
      teambit.pipelines/builder
    </Blue>
    <br />
    <Green br>build pipe</Green>
    <Blue br>
      total 9 tasks are configured to be executed in the following order
    </Blue>
    <Neutral br>1. teambit.harmony/aspect:CoreExporter</Neutral>
    <Neutral br>2. teambit.compilation/compiler:NgMultiCompiler</Neutral>
    <Neutral br>3. teambit.defender/tester:JestTest</Neutral>
    <Neutral br>4. teambit.defender/linter:EsLintLint</Neutral>
    <Neutral br>...</Neutral>
    <Neutral br>10. teambit.preview/preview:GeneratePreview</Neutral>
    <br />
    <Green br>snap pipe</Green>
    <Blue br>
      total 6 tasks are configured to be executed in the following order
    </Blue>
    <Neutral br>...</Neutral>
    <br />
    <Green br>tag pipe</Green>
    <Blue br>
      total 6 tasks are configured to be executed in the following order
    </Blue>
    <Neutral br>...</Neutral>
  </Terminal>
);

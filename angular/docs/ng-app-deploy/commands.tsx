import React from 'react';
import {
  Terminal,
  Neutral,
  Blue,
} from '@teambit/community.ui.bit-cli.terminal';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import { CommandExample } from '@teambit/community.ui.bit-cli.command-example';

export const SnapApp = () => {
  const values = {
    'component-patterns...': 'apps/my-app',
    message: '"update app"',
  };

  return <CommandExample commandName="snap" commandExample={values} />;
};

export const TagApp = () => {
  const values = {
    'component-patterns...': 'apps/my-app',
    message: '"update app"',
  };

  return <CommandExample commandName="tag" commandExample={values} />;
};

export const GetArtifacts = () => {
  const values = {
    'component-pattern': 'my-org.my-scope/apps/my-angular-app',
    task: 'build_application',
    'out-dir': 'build',
  };

  return <CommandExample commandName="artifacts" commandExample={values} />;
};

export const CiDeploy = () => (
  <Terminal>
    <Neutral>netlify deploy </Neutral>
    <Blue>--dir=build</Blue>
  </Terminal>
);

export const InstallNetlify = () => {
  const values = {
    'packages...': '@teambit/cloud-providers.deployers.netlify',
  };
  return <CommandsExplorer commandName="install" commandExample={values} />;
};

export const InstallCloudflare = () => {
  const values = {
    'packages...': '@teambit/cloud-providers.react.cloudflare',
  };
  return <CommandsExplorer commandName="install" commandExample={values} />;
};

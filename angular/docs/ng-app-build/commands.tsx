import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import {
  Terminal,
  Neutral,
  Blue,
  Green,
} from '@teambit/community.ui.bit-cli.terminal';

export const ListCapsule = () => {
  return (
    <CommandsExplorer
      commandName="capsule"
      subCommandName="list"
      commandExample={{}}
    />
  );
};

export const BitBuild = () => {
  const values = {
    'component-pattern': 'apps/my-angular-app',
  };
  return <CommandsExplorer commandName="build" commandExample={values} />;
};

export const BitTag = () => {
  const values = {
    'component-patterns...': 'apps/my-angular-app',
    message: '"update app"',
  };
  return <CommandsExplorer commandName="tag" commandExample={values} />;
};

export const ListCapsuleOutput = () => (
  <Terminal isOutput>
    <Green>workspace capsules root-dir: </Green>
    <Blue>/Users/user/Library/Caches/Bit/capsules/4fdc274b...</Blue>
  </Terminal>
);

export const ServeArtifacts = () => (
  <Terminal>
    <Neutral>npx serve </Neutral>
    <Blue>PATH_TO_WORKSPACE_CAPSULE</Blue>
    <Green>/my-org.my-scope_apps_my-angular-app</Green>
    <Neutral>/public</Neutral>
  </Terminal>
);

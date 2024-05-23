import React from 'react';
import { CommandsExplorer } from '@teambit/community.ui.bit-cli.commands-explorer';
import {
  Terminal,
  Neutral,
  Red,
  Blue,
  Green,
} from '@teambit/community.ui.bit-cli.terminal';

export const ListApps = () => {
  return (
    <CommandsExplorer
      commandName="list"
      subCommandName="app"
      commandExample={{}}
    />
  );
};

export const ListAppsOutput = () => {
  return (
    <Terminal isOutput>
      <Neutral br>┌────────────────────────────────┬──────────┐</Neutral>
      <Neutral>│ </Neutral>
      <Red>id</Red>
      <Neutral>{`                             │ `}</Neutral>
      <Red>name</Red>
      <Neutral br>{`     │`}</Neutral>
      <Neutral br>├────────────────────────────────┼──────────┤</Neutral>
      <Neutral>│ </Neutral>
      <Blue>teambit.community/apps/bit-dev</Blue>
      <Neutral>{` │ `}</Neutral>
      <Neutral>bit-dev</Neutral>
      <Neutral br>{`  │`}</Neutral>
      <Neutral>└────────────────────────────────┴──────────┘</Neutral>
    </Terminal>
  );
};

export const RunApp = () => {
  const example = {
    'app-name': 'bit-dev',
  };
  return <CommandsExplorer commandName="run" commandExample={example} />;
};

export const RunAppOutput = () => (
  <Terminal isOutput>
    <Neutral br>bit-dev app is running on http://localhost:3000</Neutral>
    <Neutral br> </Neutral>
    <Neutral br>Initial Chunk Files   | Names         |  Raw Size</Neutral>
    <Green>vendor.js</Green><Neutral>             | vendor        |   </Neutral><Blue>1.72 MB</Blue><Neutral br> |</Neutral>
    <Green>polyfills.js</Green><Neutral>          | polyfills     | </Neutral><Blue>323.16 kB</Blue><Neutral br> |</Neutral>
    <Green>styles.css, styles.js</Green><Neutral> | styles        | </Neutral><Blue>215.76 kB</Blue><Neutral br> |</Neutral>
    <Green>main.js</Green><Neutral>               | main          |  </Neutral><Blue>48.75 kB</Blue><Neutral br> |</Neutral>
    <Green>runtime.js</Green><Neutral>            | runtime       |   </Neutral><Blue>6.52 kB</Blue><Neutral br> |</Neutral>
    <Neutral br>                      | Initial Total |   2.30 MB</Neutral>
    <Neutral br> </Neutral>
    <Neutral br>Build at: 2023-02-24T10:11:28.649Z - Hash: 8186441b3939ed80 - Time: 10028ms</Neutral>
  </Terminal>
);

export const CreateApp = () => {
  const example = {
    'component-names...': 'apps/my-angular-app',
    'template-name': 'ng-app',
  };
  return <CommandsExplorer commandName="create" commandExample={example} />;
};

export const CreateNgAppOutput = () => (
  <Terminal isOutput>
    <Green br>1 component(s) were created</Green>
    <br />
    <Neutral br>my-org.my-scope/apps/my-angular-app</Neutral>
    <Neutral br>{`    location: my-scope/apps/my-angular-app`}</Neutral>
    <Neutral br>{`    env:      my-org.my-scope/envs/my-angular-env (set by template)`}</Neutral>
    <Neutral>{`    package:  @my-org/my-scope.apps.my-angular-app`}</Neutral>
  </Terminal>
);

export const InstallDeps = () => {
  return <CommandsExplorer commandName="install" commandExample={{}}/>;
};
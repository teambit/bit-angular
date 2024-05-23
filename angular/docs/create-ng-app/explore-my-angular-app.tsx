import React from 'react';
// import { ExpandCode } from '@teambit/community.ui.expand-code';
import { FileExplorer } from '@teambit/community.ui.file-explorer';
// import { composition } from './my-angular-app-files/react-app-composition-tsx';
import docs from './my-angular-app-files/my-angular-app.docs-md';
// import { app } from './my-angular-app-files/app-tsx';
import plugin from './my-angular-app-files/my-angular-app.ng-app';
import index from './my-angular-app-files';
import tsconfig from './my-angular-app-files/tsconfig.app-json';
// import { appRoot } from './my-angular-app-files/react-app-app-root-tsx';

const files = {
  // 'my-angular-app.composition.tsx': composition,
  'my-angular-app.docs.md': docs,
  'my-angular-app.ng-app.ts': plugin,
  // 'app.tsx': app,
  // 'my-angular-app.app-root.tsx': appRoot,
  'tsconfig.app.json': tsconfig,
  'index.ts': index,
};

export const NgAppDir = () => (
  <FileExplorer
    options={{
      contentFontSize: 13,
      fileTreeWidth: 230,
      codeHeight: 400,
      isDirOpen: true,
      title: 'my-scope/apps/my-angular-app',
      wordWrap: 'off',
    }}
    files={files}
    defaultFile="my-angular-app.ng-app.tsx"
  />
);

// export const ExpandReactAppDir = () => (
//   <ExpandCode
//     customTitle="Explore the generated component directory"
//     snippet={ReactAppDir}
//   />
// );

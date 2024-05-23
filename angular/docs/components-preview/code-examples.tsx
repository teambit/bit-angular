import React from 'react';
import { ContentTabs } from '@teambit/community.ui.content-tabs';
import CompositionProviderMounter from './snippets/composition-provider-mounter.mdx';
import CompositionProviderMounter2 from './snippets/composition-provider-mounter2.mdx';
import CompositionProviderWrapper from './snippets/composition-provider-wrapper.mdx';
import CompositionProviderWrapper2 from './snippets/composition-provider-wrapper2.mdx';
import CompositionProviderEnv from './snippets/composition-provider-env.mdx';
import CompositionMounterMounter from './snippets/composition-mounter-mounter.mdx';
import CompositionMounterEnv from './snippets/composition-mounter-env.mdx';

const compositionProviderContent = [
  { title: 'my-angular-env.bit-env.ts', body: <CompositionProviderEnv /> },
  { title: 'preview/mounter.ts', body: <CompositionProviderMounter /> },
  { title: 'wrapper.component.ts', body: <CompositionProviderWrapper /> },
];

export const CompositionProviderExample = () => (
  <ContentTabs tabsContent={compositionProviderContent} />
);

const compositionProviderContent2 = [
  { title: 'my-angular-env.bit-env.ts', body: <CompositionProviderEnv /> },
  { title: 'preview/mounter.ts', body: <CompositionProviderMounter2 /> },
  { title: 'wrapper.ts', body: <CompositionProviderWrapper2 /> },
];

export const CompositionProviderExample2 = () => (
  <ContentTabs tabsContent={compositionProviderContent2} />
);

const compositionMounterContent = [
  { title: 'my-angular-env.bit-env.ts', body: <CompositionMounterEnv /> },
  { title: 'preview/docs.tsx', body: <CompositionMounterMounter /> },
];

export const CompositionMounterExample = () => (
  <ContentTabs tabsContent={compositionMounterContent} />
);

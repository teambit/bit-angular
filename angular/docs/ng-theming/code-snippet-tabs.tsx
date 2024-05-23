import { ContentTabs } from '@teambit/community.ui.content-tabs';
import React from 'react';
import MyBaseThemeIndex from './code-snippets/my-base-theme-index.mdx';
import MyBaseTheme from './code-snippets/my-base-theme-module.mdx';
import MyDarkThemeIndex from './code-snippets/my-dark-theme-index.mdx';
import MyDarkTheme from './code-snippets/my-dark-theme-module.mdx';
import CompositionProviderEnv from './code-snippets/composition-provider-env.mdx';
import CompositionProviderMounter from './code-snippets/composition-provider-mounter.mdx';
import CompositionProviderWrapper from './code-snippets/composition-provider-wrapper.mdx';

const myBaseTheme = [
  { title: '_my-base-theme.module.scss', body: <MyBaseTheme /> },
  { title: 'index.ts', body: <MyBaseThemeIndex /> },
];

export const MyBaseThemeTabs = () => <ContentTabs tabsContent={myBaseTheme} />;

const myDarkTheme = [
  { title: '_my-dark-theme.module.scss', body: <MyDarkTheme /> },
  { title: 'index.ts', body: <MyDarkThemeIndex /> },
];

export const MyDarkThemeTabs = () => <ContentTabs tabsContent={myDarkTheme} />;

const compositionProviderContent = [
  { title: 'my-angular-env.bit-env.ts', body: <CompositionProviderEnv /> },
  { title: 'preview/mounter.ts', body: <CompositionProviderMounter /> },
  { title: 'wrapper.component.ts', body: <CompositionProviderWrapper /> },
];

export const CompositionProviderExample = () => (
  <ContentTabs tabsContent={compositionProviderContent} />
);

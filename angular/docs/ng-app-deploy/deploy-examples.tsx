import { ContentTabs, } from '@teambit/community.ui.content-tabs';
import React from 'react';
import styles from './app-deployment.module.scss';
import Netlify from './netlify.mdx';
// import Cloudflare from './cloudflare.mdx';

const StartNew = () => <span className={styles.tabTitle}>Netlify</span>;
// const Add = () => <span className={styles.tabTitle}>Cloudflare</span>;

const content = [
  { title: <StartNew/>, body: <Netlify /> },
  // { title: Add, Body: Cloudflare },
];

export const DeployerExample = () => (
  <ContentTabs
    tabsContent={content}
    tabsUrlParam="deployer"
  />
);

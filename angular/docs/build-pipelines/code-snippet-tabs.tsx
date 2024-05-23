import React from 'react';
import { ContentTabs } from '@teambit/community.ui.content-tabs';
import JestService from './code-snippets/jest-service.mdx';
import JestTask from './code-snippets/jest-build-task.mdx';
import AddTaskBuild from './code-snippets/add-task-build.mdx';
import AddTaskReplaceBuild from './code-snippets/add-replace-task-build.mdx';
import AddTaskSnap from './code-snippets/add-task-snap.mdx';
import AddTaskTag from './code-snippets/add-task-tag.mdx';

const jestContent = [
  { title: 'Jest env service', body: <JestService /> },
  { title: 'Jest build task', body: <JestTask /> },
];

export const JestTabs = () => <ContentTabs tabsContent={jestContent} />;

const addBuildContent = [
  { title: 'Build pipeline', body: <AddTaskBuild /> },
  { title: 'Build pipeline - add and replace', body: <AddTaskReplaceBuild /> },
  { title: 'Snap pipeline', body: <AddTaskSnap /> },
  { title: 'Tag pipeline', body: <AddTaskTag /> },
];

export const AddBuildTabs = () => <ContentTabs tabsContent={addBuildContent} />;

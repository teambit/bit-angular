// import { PlainBubbleNode } from '@teambit/community.entity.graph.bubble-graph';
import React from 'react';
import {
  createBubbleGraph,
  //   PlainBubbleNode,
} from '@teambit/community.entity.graph.bubble-graph';
import { BubbleGraph } from '@teambit/community.ui.graph.bubble-graph';

const appNodes = createBubbleGraph([
  {
    id: 'teambit.community/apps/bit-dev@1.96.53',
    dependencies: ['teambit.docs/ui/community-docs@1.96.36'],
    payload: {
      icon: 'https://static.bit.dev/extensions-icons/react.svg',
      forceActive: true,
    },
    row: 2,
    col: 1,
  },
  {
    id: 'teambit.docs/ui/community-docs@1.96.36',
    dependencies: [],
    payload: {
      icon: 'https://static.bit.dev/extensions-icons/react.svg',
      forceActive: true,
    },
    row: 2,
    col: 6,
  },
]);

export const AppGraph = () => <BubbleGraph nodes={appNodes} />;

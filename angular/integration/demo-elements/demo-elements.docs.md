---
labels: ['angular', 'typescript', 'demo-elements']
description: 'A `demo-elements` component.'
---

Import `DemoElementsComponent` into your application and use the returned selector to create a component
in the framework of your choice. For example with react:

```ts
import { DemoElementsComponent } from '@my-scope/demo-elements';
import type { ReactNode } from 'react';

export type DemoElementsProps = {
  /**
   * sets the component children.
   */
  children?: ReactNode;
};

// Use the component:
export function DemoElements({ children }: DemoElementsProps) {
  return (
    <DemoElementsComponent>
      {children}
    </DemoElementsComponent>
  );
}

```

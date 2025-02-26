---
labels: ['angular', 'typescript', 'demo-elements']
description: 'A `demo-elements` component.'
---

Import `DemoElementsComponent` into your application:

```ts
import { DemoElementsComponent } from './demo-elements.component';

// add it to your component imports
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DemoElementsComponent
  ]
})
export class AppComponent {}
```

Use `DemoElementsComponent` in your generators:

```html
<demo-elements></demo-elements>
```

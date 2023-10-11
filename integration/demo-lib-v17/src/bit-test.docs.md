---
labels: ['angular', 'typescript', 'bit-test']
description: 'A `bit-test` component.'
---

# Bit test documentation
Import `BitTestModule` :

```typescript
import { BitTestModule } from './bit-test.module';

// add it to your module imports
@NgModule({
  // ...
  imports: [
    BitTestModule
  ]
  // ...
})
export class AppModule {}
```

Use `BitTestComponent` in your templates :

```html
<bit-test></bit-test>
```

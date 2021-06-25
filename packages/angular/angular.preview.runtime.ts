import { Type } from '@angular/core';
import { SlotRegistry, Slot } from '@teambit/harmony';
import PreviewAspect, { PreviewPreview, PreviewRuntime } from '@teambit/preview';
// import { HighlighterProvider } from '@teambit/react.ui.highlighter-provider';

export type Provider = Type<any>;
export type ProviderSlot = SlotRegistry<Provider[]>;

export class AngularPreview {
  constructor(private preview: PreviewPreview, private providerSlot: ProviderSlot) {}

  registerProvider(provider: Provider[]) {
    this.providerSlot.register(provider);
  }

  getRenderingContext() {
    return {
      providers: this.providerSlot.values().flat(10),
    };
  }

  static runtime: any = PreviewRuntime;

  static slots = [Slot.withType<Provider>()];

  static dependencies: any = [PreviewAspect];

  static async provider([preview]: [PreviewPreview], config: any, [providerSlot]: [ProviderSlot]) {
    const angularPreview = new AngularPreview(preview, providerSlot);

    // angularPreview.registerProvider([HighlighterProvider]);

    preview.registerRenderContext(() => {
      return angularPreview.getRenderingContext();
    });
    return angularPreview;
  }
}

export default AngularPreview;

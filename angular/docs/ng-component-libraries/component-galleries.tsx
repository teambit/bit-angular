import React from 'react';
import { ComponentCardDisplay } from '@teambit/components.blocks.component-card-display';
import styles from './ng-component-libraries.module.scss';

export const MaterialUI = () => (
  <ComponentCardDisplay
    className={styles.cardsGallery}
    componentIds={[
      'learnbit-angular.material-design-system/theme/my-base-theme',
      'learnbit-angular.material-design-system/theme/my-dark-theme',
      'learnbit-angular.material-design-system/theme/my-light-theme',
      'learnbit-angular.material-design-system/ui/my-theme-picker',
      'learnbit-angular.material-design-system/ui/my-dialog',
      'learnbit-angular.material-design-system/apps/my-angular-app',
    ]}
  />
);

export const CDKUI = () => (
  <ComponentCardDisplay
    className={styles.cardsGallery}
    componentIds={[
      'learnbit-angular.design-system/theme/my-base-theme',
      'learnbit-angular.design-system/theme/my-dark-theme',
      'learnbit-angular.design-system/theme/my-light-theme',
      'learnbit-angular.design-system/ui/my-theme-picker',
      'learnbit-angular.design-system/ui/my-dialog',
      'learnbit-angular.design-system/apps/my-angular-app',
    ]}
  />
);

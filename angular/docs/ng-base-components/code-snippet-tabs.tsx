import React from 'react';
import { ContentTabs } from '@teambit/community.ui.content-tabs';
import MyBaseThemeCssVars from './code-snippets/css/my-base-theme-module-css-vars.mdx';
import MyAppMainStyleCssVars from './code-snippets/css/app-main-style-css-vars.mdx';
import MyButtonStyleCssVars from './code-snippets/css/my-button-style-css-vars.mdx';
import MyBaseThemeScssVars from './code-snippets/scss/my-base-theme-module-scss-vars.mdx';
import MyAppMainStyleScssVars from './code-snippets/scss/app-main-style-scss-vars.mdx';
import MyButtonStyleScssVars from './code-snippets/scss/my-button-style-scss-vars.mdx';
import MyAppMainModuleJSVars from './code-snippets/js/app-main-module-js-vars.mdx';
import MyBaseThemeModuleJSVars from './code-snippets/js/my-base-theme-module-js-vars.mdx';
import MyButtonComponentJSVars from './code-snippets/js/my-button-component-js-vars.mdx';
import MyThemeProviderJSVars from './code-snippets/js/my-theme-provider-js-vars.mdx';

const myBaseThemeCssVars = [
  { title: 'theme/my-base-theme/_my-base-theme.module.scss', body: <MyBaseThemeCssVars /> },
  { title: 'my-angular-app/src/styles.scss', body: <MyAppMainStyleCssVars /> },
  { title: 'ui/button/button.component.scss', body: <MyButtonStyleCssVars /> },
];

export const CSSVarsExample = () => <ContentTabs tabsContent={myBaseThemeCssVars} />;

const myBaseThemeScssVars = [
  { title: 'theme/my-base-theme/_my-base-theme.module.scss', body: <MyBaseThemeScssVars /> },
  { title: 'my-angular-app/src/styles.scss', body: <MyAppMainStyleScssVars /> },
  { title: 'ui/button/button.component.scss', body: <MyButtonStyleScssVars /> },
];

export const SCSSVarsExample = () => <ContentTabs tabsContent={myBaseThemeScssVars} />;

const myBaseThemeJsVars = [
  { title: 'theme/my-theme-provider/my-theme.provider.ts', body: <MyThemeProviderJSVars /> },
  { title: 'theme/my-base-theme/my-base-theme.module.ts', body: <MyBaseThemeModuleJSVars /> },
  { title: 'my-angular-app/src/app/app.module.ts', body: <MyAppMainModuleJSVars /> },
  { title: 'ui/button/button.component.ts', body: <MyButtonComponentJSVars /> },
];

export const JSVarsExample = () => <ContentTabs tabsContent={myBaseThemeJsVars} />;

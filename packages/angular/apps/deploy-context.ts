import { AppDeployContext } from '@teambit/application';
import { AngularAppBuildResult } from './angular-build-result';

export type AngularDeployContext = AngularAppBuildResult & AppDeployContext;

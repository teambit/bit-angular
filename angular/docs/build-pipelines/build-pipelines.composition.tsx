import React from 'react';
import { BuildPipelines } from './index';
import { mockAngularEnvDocsData } from "@teambit/envs.docs.env-docs-data";

export const BasicNg = () => (
  <BuildPipelines {...mockAngularEnvDocsData} />
);

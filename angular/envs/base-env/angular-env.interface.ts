import { CompilerEnv } from '@teambit/compiler';
import { SchemaEnv } from '@teambit/schema';
import { Env } from '@teambit/envs';
import { PreviewEnv } from '@teambit/preview';
import { TesterEnv } from '@teambit/tester';
import { LinterEnv } from '@teambit/linter';
import { FormatterEnv } from '@teambit/formatter';
import { BuilderEnv } from '@teambit/builder';
import { GeneratorEnv } from '@teambit/generator';
import { PackageEnv } from '@teambit/pkg';
import { AppsEnv } from '@teambit/application';

export interface AngularEnvInterface
  extends Env,
    AppsEnv,
    CompilerEnv,
    TesterEnv,
    PreviewEnv,
    SchemaEnv,
    LinterEnv,
    FormatterEnv,
    BuilderEnv,
    GeneratorEnv,
    PackageEnv {}

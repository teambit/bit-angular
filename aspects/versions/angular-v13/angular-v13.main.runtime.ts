import { AngularDeps, AngularBaseMain, loadEsmModule } from '@teambit/angular-base';
import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { CompilerOptions } from '@teambit/compiler';
import { EnvTransformer } from '@teambit/envs';
import { AngularV13Aspect } from './angular-v13.aspect';
import { AngularV13Env } from './angular-v13.env';

export class AngularV13Main extends AngularBaseMain {
  static async provider([
    jestAspect,
    compiler,
    tester,
    eslint,
    ngPackagr,
    generator,
    webpack,
    workspace,
    envs,
    isolator,
    pkg,
    application,
    aspectLoader,
    multicompiler,
    babel,
    dependencyResolver,
  ]: AngularDeps): Promise<AngularBaseMain> {
    const angularV13Env = new AngularV13Env(
      jestAspect,
      compiler,
      tester,
      eslint,
      ngPackagr,
      generator,
      isolator,
      webpack,
      workspace,
      pkg,
      application,
      aspectLoader,
      multicompiler,
      babel,
      dependencyResolver,
    );
    // @ts-ignore
    return new AngularV13Main(envs, angularV13Env);
  }



  /**
   * Override the compiler options for the Angular environment.
   * Compiler options combine both typescript "compilerOptions" and Angular specific "angularCompilerOptions"
   */
  // @ts-ignore
  async overrideCompilerOptions(tsconfigPath: string, bitCompilerOptions?: Partial<CompilerOptions>): Promise<EnvTransformer>;
  // @ts-ignore
  async overrideCompilerOptions(compilerOptions: AngularCompilerOptions, bitCompilerOptions?: Partial<CompilerOptions>): Promise<EnvTransformer>;
  // @ts-ignore
  async overrideCompilerOptions(opts?: AngularCompilerOptions | string, bitCompilerOptions?: Partial<CompilerOptions>): Promise<EnvTransformer> {
    let tsCompilerOptions: AngularCompilerOptions | undefined;
    if (typeof opts === 'string') {
      const { readConfiguration } = await loadEsmModule('@angular/compiler-cli');
      tsCompilerOptions = readConfiguration(opts).options;
    } else {
      tsCompilerOptions = opts;
    }

    return this.envs.override({
      getCompiler: () => {
        // @ts-ignore
        return this.angularEnv.getCompiler(tsCompilerOptions, bitCompilerOptions);
      },
      getBuildPipe: () => {
        // @ts-ignore
        return this.angularEnv.getBuildPipe(tsCompilerOptions, bitCompilerOptions);
      }
    });
  }
}

AngularV13Aspect.addRuntime(AngularV13Main);

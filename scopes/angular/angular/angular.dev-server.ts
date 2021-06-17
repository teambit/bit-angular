import { DevServer, DevServerContext } from '@teambit/bundler';
import {
  runTransformersWithContext,
  WebpackConfigMutator, WebpackConfigTransformContext,
  WebpackConfigTransformer, WebpackConfigWithDevServer,
  WebpackDevServer,
  WebpackMain
} from '@teambit/webpack';
import { Workspace } from '@teambit/workspace';
import { AngularVersionAdapter } from './angular-version-adapter';

export class AngularDevServer {

  constructor(private workspace: Workspace, private webpackMain: WebpackMain, private adapter: AngularVersionAdapter) {}

  // private getFileMap(components: Component[]) {
  //   return components.reduce<{ [key: string]: ComponentMeta }>((index, component: Component) => {
  //     component.state.filesystem.files.forEach((file) => {
  //       index[file.path] = {
  //         id: component.id.toString(),
  //         homepage: `/${component.id.fullName}`
  //       };
  //     });
  //
  //     return index;
  //   }, {});
  // }

  async createDevServer(context: DevServerContext, transformers: WebpackConfigTransformer[] = []): Promise<DevServer> {
    console.log(context.entry)
    // todo <div id="root"></div>
    // const compositions = this.getFileMap(context.components);
    const defaultConfig = await this.adapter.getDevWebpackConfig(context, this.webpackMain.logger, 'serve', {}); // todo extra opts
    const defaultTransformer: WebpackConfigTransformer = configMutator => configMutator.merge([defaultConfig]);
    const config = this.adapter.webpackConfigFactory(
      context.id, this.workspace.path, /* context.entry */ [], context.rootPath, context.publicPath, this.webpackMain.pubsub, {}
    );
    console.log(config);
    const configMutator = new WebpackConfigMutator(config);
    const transformerContext: WebpackConfigTransformContext = {
      mode: 'dev',
    };
    const afterMutation = runTransformersWithContext(
      configMutator.clone(),
      [defaultTransformer, ...transformers],
      transformerContext
    );

    return new WebpackDevServer(afterMutation.raw as WebpackConfigWithDevServer, this.adapter.webpack, this.adapter.webpackDevServer);
  }
}

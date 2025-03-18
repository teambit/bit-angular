import { ViteReact } from '@bitdev/react.app-types.vite-react';

export default ViteReact.from({
  /**
   * name of your app.
   */
  name: 'my-react-app',

  /**
   * determine whether to use ssr mode or not.
   */
  ssr: false,

  /**
   * vite config for the browser target.
   * looks for vite.config.mjs and vite.config.js by default.
   * use a vite.config.mjs file if mjs is required.
   */
  // viteConfigPath: 'vite.config.js'

  /**
   * name of the bit artifact of persist.
   * this later can be fetched, and used for deployment and execution.
   */
  // artifactName: 'app-bundle',

  /**
   * pipeline for deployment of the app.
   */
  // deploy: (context) => {},

  /**
   * configure port range for the dev server to use.
   */
  // portRange: [3000, 3200],

  /**
   * vite config for the express server target.
   */
  // viteServerBuildConfigPath: 'vite-server.config.js',

  /**
   * configure the server app root filename.
   * defaults to: "server.app-root"
   */
  // serverRoot: 'server.app-root',

  /**
   * peer dependencies to alias from the app component dependencies.
   * ensures a single instance for the dependency across the app graph.
  */
  // peers: [
  //   'react',
  //   'react-dom',
  //   'react-router-dom',
  //   'graphql',
  //   '@apollo/client'
  // ],
});

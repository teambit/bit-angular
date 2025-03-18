import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.js";
import { MyReactApp } from "./my-react-app.js";

interface IRenderProps {
  path: string;
}

export const render = async ({ path }: IRenderProps) => {
  return ReactDOMServer.renderToString(
    // @ts-ignore
    <StaticRouter location={path}>
      <MyReactApp />
    </StaticRouter>
  );
};

/**
 * implement loadScripts() to inject scripts to the head
 * during SSR.
 */
// export const loadScripts = async () => {
//   return '<script></script>';
// }

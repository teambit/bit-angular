import { BrowserRouter } from 'react-router-dom';
import {
  createRoot,
  // hydrateRoot
} from 'react-dom/client';
import { MyReactApp } from "./my-react-app.js";

/**
 * comment this in for server-side rendering (ssr) and comment
 * out of the root.render() invocation below.
*/
// hydrateRoot(
//   document.getElementById("root") as HTMLElement,
//   <BrowserRouter>
//     <MyReactApp />
//   </BrowserRouter>
// );

if (import.meta.hot) {
  import.meta.hot.accept();
}

/**
 * mounting for client side rendering.
 */
const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
// @ts-ignore
  <BrowserRouter>
    <MyReactApp />
  </BrowserRouter>
);

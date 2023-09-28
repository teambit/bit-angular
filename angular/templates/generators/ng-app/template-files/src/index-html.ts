import { ComponentContext, ComponentFile } from '@teambit/generator';

export const indexHtmlFile = (context: ComponentContext): ComponentFile => {
  const { namePascalCase: Name } = context;
  return {
    relativePath: `src/index.html`,
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${Name}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAeCAYAAAA/xX6fAAAACXBIWXMAAAsSAAALEgHS3X78AAADZklEQVRIiZVXS0wTURS98+nMlNIWdUeRlgllow5ujC4MNnFjYgSCbBQ/hbjRRGCpRiPGDUt140YNMVFjjAoYjKIhhYif+Am48UMEplCkfEI/JIKa1NyxM7wOnc7MSSZ9895978y9c++ZWyqTyYBViEGpHgCUS56OeXiOG2dZ9kFqceqs1TNMCcWgtB0AwtnLq85PRKc0G5qmMwLPjzpYtjOxEL1vm1AMSgGCxJ9vI0lIgmGYvwLPD7Msez4xL78yJBSDUglBUl3oKXft3AE/43MQGVp3Xg4cDvYXz3HPWYZtX5qXZYWwonJbOPte6gruJnDvzi2Yjc9BfWOT1S0g8Pysw8H2IaH1rAGAMl8pDEWeKeOKqmqYlKN2tgNtyxoA2lpPaeOOC2fsblcIB60aezxuONhQq93X1+6HkhJvwT0kOI5L2PKwOXwk597r9UD76ZN2jlA8HLFq3BI+um4ufOywZTKWYSaRMGHFuLGhDtzuYmUci82AnK1Df/lmy6QURSUte9jWuha6q9euQ8flTu3ealhpmn5jyUMsdJ+vVBmn08vQ/3IAunv7IJlMKXPV0lYI1ew2JaQoiCPhpJkh6V3/iwFIpdKQSCQVUhXtreZeUhT9QZE2MSgZFj9Z6Iia0D6Yjs0oWhrwl8PE91FtzUwIMqtLlFoWSWPv1godk6WszKeEGEOIhDIh4oWEAL8ooIq3GJQiALBHb4SFPvJx2PAQPfCdBqokJdx6YNGvpuMbVA/zJo6+0M1QSAhoilohPewAgIt6o9FPr7Xa+/L1m5IsKlZWVrUxyhtmKgJDHAhK6whdRUWDy0uxEGv00GShIw41teQQkh9gMnlUIei6fTe/p9nfiH6BLIWHj3pzyPTAzOx58lSbzRdWhqG7wejzRBb6f8IeQzIVpEeFhEAlzJE3MlmwFN6+e29KiCJAloheCGiKfgy6nmbErJchYdRE5QP2Nr+X54tID2F87DO2g80AIFs+yQTYwbmLXTdVMtC/w/Gxz10AgMSXCqmPGVBVsAzcLldlanH6BGlu2Ahn28YrAHA837pRSJ2C8IPnuL1qW6iHlc4bm+IuvfTpCVG6nIJwIF/zS8LyfwsxKIWyHiuJpRJiQjgF4VxyYQrXzIGEdi5snP3ilijj3PTHvdF3w9b+TAb+Afl3jDi6Q4zhAAAAAElFTkSuQmCC">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`
  };
};

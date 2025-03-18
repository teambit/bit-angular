import { MemoryRouter } from 'react-router-dom';
import { MyReactApp } from "./my-react-app.js";

export const MyReactAppBasic = () => {
  return (
    // @ts-ignore
    <MemoryRouter>
      <MyReactApp />
    </MemoryRouter>
  );
}

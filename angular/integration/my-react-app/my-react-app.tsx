// @ts-nocheck
import { Routes, Route } from 'react-router-dom';
import { DemoElementsComponent } from '@bitdev/angular.integration.demo-elements';

export function MyReactApp() {
  return (
    <Routes>
      <Route path="/" element={<DemoElementsComponent name="Bit"/>}/>
    </Routes>
  );
}

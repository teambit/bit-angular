import { ComponentContext } from '@teambit/generator';

export function indexFile({ namePascalCase: Name, name }: ComponentContext) {
  return `export { ${Name}Extension, ${Name}Extension as default } from './${name}.extension';
`;
}

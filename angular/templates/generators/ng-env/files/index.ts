import { ComponentContext } from '@teambit/generator';

export function indexFile({ namePascalCase: Name, name }: ComponentContext) {
  // language=TypeScript
  return `export { ${Name}, ${Name} as default } from './${name}.bit-env';
`;
}

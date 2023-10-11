import { ComponentFile } from '@teambit/generator';

export const tsconfigFile = (angularVersion: number): ComponentFile => {
  return {
    relativePath: 'tsconfig.app.json',
    content: `/* To learn more about this file see: https://angular.io/config/tsconfig. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc/app",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "allowJs": true,
    ${angularVersion >= 17 ? `"target": "ES2022",
    "module": "ES2022"` : `"target": "es2017",
    "module": "es2020"`},
    "preserveSymlinks": false,
    "lib": [
      "${angularVersion >= 17 ? `ES2022` : `ES2018`}",
      "dom"
    ],
    "types": []
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  },
  "files": [
    "./src/main.ts",
    "./src/polyfills.ts"
  ],
  "include": [
    "./src/**/*.d.ts"
  ],
  "exclude":[
    "./src/**/*.spec.ts"
  ]
}
`,
  };
};

import { ComponentFile } from '@teambit/generator';

export const tsconfigFile = (angularVersion: number, ssr: boolean): ComponentFile => {
  return {
    relativePath: 'tsconfig.app.json',
    content: `/* To learn more about this file see: https://angular.io/config/tsconfig. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "declaration": false,
    "downlevelIteration": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "importHelpers": true,
    "isolatedModules": true,
        "lib": [
      "${angularVersion >= 17 ? `ES2022` : `ES2018`}",
      "dom"
    ],
    "moduleResolution": "${angularVersion >= 19 ? `bundler` : `node`}",
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "outDir": "./dist/out-tsc",
    "preserveSymlinks": false,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "types": [],
    ${angularVersion >= 17 ? `"target": "ES2022",
    "module": "ES2022"` : `"target": "es2017",
    "module": "es2020"`},${angularVersion >= 15 ? `
    "useDefineForClassFields": false,` : ``}
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true,
  },
  "files": [
    "./src/main.ts",${ssr ? `
    "./src/main.server.ts",` : ``}${angularVersion < 19 ? `` : `
    "./src/server.ts"`}${angularVersion >= 15 ? `` : `
    "./src/polyfills.ts"`}
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

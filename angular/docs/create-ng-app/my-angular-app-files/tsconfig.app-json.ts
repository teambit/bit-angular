export default `/* To learn more about this file see: https://angular.io/config/tsconfig. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc/app",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "importHelpers": true,
    "allowJs": true,
    "target": "es2017",
    "module": "es2020",
    "preserveSymlinks": false,
    "lib": [
      "es2018",
      "dom"
    ],
    "types": []
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true,
    "enableIvy": true
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
`;

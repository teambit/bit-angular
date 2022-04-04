#!/usr/bin/env node

const process = require( 'process' );
const replace = require('replace-in-file');
const { resolve } = require('path');

const argv = key => {
  // Return true if the key exists and a value is defined
  if ( process.argv.includes( `--${ key }` ) ) return true;

  const value = process.argv.find( element => element.startsWith( `--${ key }=` ) );

  // Return null if the key does not exist and a value is not defined
  if ( !value ) return null;

  return value.replace( `--${ key }=` , '' );
}

const regexp = [];
// Remove all versions but this one
const version = parseInt(argv('version'));
regexp.push(new RegExp(`\\s\\s"teambit\\.angular\\/versions\\/angular\\-v(?!${version})\\d\\d?":\\s\\{\\},\\n`, "g"));

const defaultEnv = argv('default');
// Remove default env & app if needed
if(!defaultEnv) {
  regexp.push(new RegExp(`\\s\\s"teambit\\.angular\\/angular":\\s\\{\\},\\n`, "g"));
  regexp.push(new RegExp(`\\s\\s"examples\\/demo-app":\\s\\{\\},\\n`, "g"));
}

try {
  const results = replace.sync({
    files: resolve(__dirname, '..', 'workspace.jsonc'),
    from: regexp,
    to: '',
    countMatches: true,
  });
  console.log('Replacement results:', results);
}
catch (error) {
  console.error('Error occurred:', error);
}

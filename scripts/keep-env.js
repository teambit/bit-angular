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

const version = parseInt(argv('version'));
const regexp = new RegExp(`\\s\\s"teambit\\.angular\\/angular\\-v(?!${version})\\d\\d?":\\s\\{\\},\\n`, "g")
console.log(regexp);
const options = {
  files: resolve(__dirname, '..', 'workspace.jsonc'),
  from: regexp,
  to: '',
};

try {
  const results = replace.sync(options);
  console.log('Replacement results:', results);
}
catch (error) {
  console.error('Error occurred:', error);
}

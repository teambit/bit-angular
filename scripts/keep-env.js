#!/usr/bin/env node

const { parse } = require('json5');
const { argv } = require('process');
const { sync } = require('replace-in-file');
const { resolve } = require('path');
const { readFileSync, writeFileSync } = require('fs');

const args = key => {
  // Return true if the key exists and a value is defined
  if (argv.includes(`--${key}`)) return true;

  const value = argv.find(element => element.startsWith(`--${key}=`));

  // Return null if the key does not exist and a value is not defined
  if (!value) return null;

  return value.replace(`--${key}=`, '');
};

// Remove all versions but this one
const version = parseInt(args('version'));
const defaultEnv = args('default');

const regexp = [];
regexp.push(new RegExp(`\\s\\s"bitdev\\.angular\\/envs\\/angular\\-v(?!${version})\\d\\d?\\-env":\\s\\{\\},\\n`, 'g'));

// Remove default env & app if needed
if (!defaultEnv) {
  regexp.push(new RegExp(`\\s\\s"bitdev\\.angular\\/angular\\-env":\\s\\{\\},\\n`, 'g'));
  regexp.push(new RegExp(`\\s\\s"integration\\/demo-app":\\s\\{\\},\\n`, 'g'));
}

try {
  const results = sync({
    files: resolve(__dirname, '..', 'workspace.jsonc'),
    from: regexp,
    to: '',
    countMatches: true
  });
  console.log('Replacement results:', results);
} catch (error) {
  console.error('Error occurred:', error);
}

// Update bitmap with only the envs we want
const bitmapPath = resolve(__dirname, '..', '.bitmap');
let bitmap = parse(readFileSync(bitmapPath, 'utf8'));
bitmap = Object.fromEntries(Object.entries(bitmap).filter(([key]) => {
  let keepEntry = !key.match(/angular-v\d\d?-env/gm) || key.includes(`angular-v${version}-env`);
  if (!defaultEnv) {
    keepEntry = keepEntry && !key.includes('angular-env');
  }
  return keepEntry;
}));
writeFileSync(bitmapPath, JSON.stringify(bitmap, null, 4));

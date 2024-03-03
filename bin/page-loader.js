#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'module';
import pageLoader from '../src/index.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .version(version, '-V, --version', 'output the version number')
  .description('Page-loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, { output }) => pageLoader(url, output)
    .then((filePath) => console.log(`File was successfully downloaded into '${filePath}'`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    }))
  .parse(process.argv);

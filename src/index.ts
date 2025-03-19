#!/usr/bin/env node

import { Command } from 'commander';
import path from "path";
import { Server } from './server/server';

const program = new Command();

program
  .name('domaze')
  .description('Domaze CLI - https://github.com/fcapolini/domaze')
  .version('1.0.0');

program.command('serve')
  .description('serve a Domaze project')
  .argument('<pathname>', 'path to docroot')
  .option('-p, --port <number>', 'port number, default: 3000')
  .action((pathname, options) => {
    const docroot = path.normalize(path.join(process.cwd(), pathname));
    const port = parseInt(options.port) || 3000;
    new Server({ docroot, port }).start();
  });

program.parse();

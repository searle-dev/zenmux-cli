#!/usr/bin/env node
import { Command } from 'commander';
import { registerAccountCommands } from './commands/account';
import { registerStatusCommand } from './commands/status';
import { registerFlowRateCommand } from './commands/flow-rate';
import { registerPaygCommand } from './commands/payg';
import { registerGenerationCommand } from './commands/generation';
import { registerCompletionCommand } from './commands/completion';
import { registerStatuslineCommand } from './commands/statusline';

const program = new Command();

program
  .name('zenmux')
  .description('ZenMux account management CLI')
  .version('1.0.0');

registerAccountCommands(program);
registerStatusCommand(program);
registerFlowRateCommand(program);
registerPaygCommand(program);
registerGenerationCommand(program);
registerCompletionCommand(program);
registerStatuslineCommand(program);

program.parse();

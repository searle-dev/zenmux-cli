import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { loadConfig, saveConfig, DEFAULT_BASE_URL } from '../lib/config';
import { writeClaudeSettings } from '../lib/claude';
import chalk from 'chalk';

/** Show first 6 and last 4 chars, mask the middle with ****. */
function maskKey(value: string): string {
  if (value.length <= 10) return '*'.repeat(value.length);
  return value.slice(0, 6) + '****' + value.slice(-4);
}

async function promptKey(message: string, required: boolean): Promise<string> {
  return input({
    message,
    transformer: (value, { isFinal }) => {
      if (!value) return '';
      return isFinal ? maskKey(value) : value.slice(0, 6) + '****' + (value.length > 10 ? value.slice(-4) : '');
    },
    validate: required ? (v) => v.trim() !== '' || 'This field is required.' : undefined,
  });
}

export function registerAccountCommands(program: Command): void {
  const account = program
    .command('account')
    .description('Manage ZenMux accounts');

  // list
  account
    .command('list')
    .description('List all accounts')
    .action(() => {
      const config = loadConfig();
      const names = Object.keys(config.accounts);
      if (names.length === 0) {
        console.log('No accounts configured. Run: zenmux account add <name>');
        return;
      }
      for (const name of names) {
        const prefix = name === config.active ? chalk.green('* ') : '  ';
        const acc = config.accounts[name];
        const hasApiKey = acc.api_key ? '' : chalk.dim(' (no api_key)');
        console.log(`${prefix}${name}${hasApiKey}`);
      }
    });

  // _names (hidden — used by shell completion)
  account
    .command('_names', { hidden: true })
    .action(() => {
      const config = loadConfig();
      Object.keys(config.accounts).forEach((n) => console.log(n));
    });

  // add
  account
    .command('add <name>')
    .description('Add a new account')
    .action(async (name: string) => {
      const config = loadConfig();
      if (config.accounts[name]) {
        console.error(`Error: Account "${name}" already exists. Remove it first with: zenmux account remove ${name}`);
        process.exit(1);
      }

      const management_key = await promptKey('Management Key (required):', true);
      const api_key_input = await promptKey('API Key (optional, press enter to skip):', false);
      const base_url_input = await input({
        message: `Base URL (default: ${DEFAULT_BASE_URL}):`,
      });

      config.accounts[name] = {
        management_key: management_key.trim(),
        ...(api_key_input.trim() ? { api_key: api_key_input.trim() } : {}),
        base_url: base_url_input.trim() || DEFAULT_BASE_URL,
      };

      const isFirst = config.active === null;
      if (isFirst) config.active = name;

      saveConfig(config);
      console.log(chalk.green(`✓ Account "${name}" added.`));
      if (isFirst) console.log(chalk.dim(`  Set as active account.`));
    });

  // remove
  account
    .command('remove <name>')
    .description('Remove an account')
    .action((name: string) => {
      const config = loadConfig();

      if (!config.accounts[name]) {
        const available = Object.keys(config.accounts).join(', ') || '(none)';
        console.error(`Error: Account "${name}" not found. Available: ${available}`);
        process.exit(1);
      }

      // Priority 1: only account
      if (Object.keys(config.accounts).length === 1) {
        console.error('Error: Cannot remove the only account.');
        process.exit(1);
      }

      // Priority 2: active account
      if (name === config.active) {
        const others = Object.keys(config.accounts).filter(n => n !== name).join(', ');
        console.error(`Error: Cannot remove active account "${name}". Run: zenmux account use <other> first. Available: ${others}`);
        process.exit(1);
      }

      delete config.accounts[name];
      saveConfig(config);
      console.log(chalk.green(`✓ Account "${name}" removed.`));
    });

  // use
  account
    .command('use [name]')
    .description('Switch active account and update Claude Code settings')
    .action(async (name: string | undefined) => {
      const config = loadConfig();
      const names = Object.keys(config.accounts);

      if (names.length === 0) {
        console.error('Error: No accounts configured. Run: zenmux account add');
        process.exit(1);
      }

      // Interactive selection when name is omitted
      if (!name) {
        name = await select({
          message: 'Select account to activate:',
          choices: names.map((n) => ({
            value: n,
            name: n === config.active ? `${n}  (current)` : n,
          })),
        });
      }

      if (!config.accounts[name]) {
        const available = names.join(', ') || '(none)';
        console.error(`Error: Account "${name}" not found. Available: ${available}`);
        process.exit(1);
      }

      const acc = config.accounts[name];

      // Pre-flight validation before any writes
      if (!acc.api_key) {
        console.error(`Error: Account "${name}" has no api_key. Remove and re-add: zenmux account remove ${name} && zenmux account add ${name}`);
        process.exit(1);
      }

      config.active = name;
      saveConfig(config);
      writeClaudeSettings(acc.api_key, acc.base_url);

      console.log(chalk.green(`✓ Switched to account "${name}".`));
      console.log(chalk.dim(`  Claude Code updated: ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL set.`));
    });
}

import { Command } from 'commander';
import { loadConfig, getActiveAccount } from '../lib/config';
import { api } from '../lib/api';
import { renderSection, renderKV, printJson, printError } from '../lib/render';

export function registerPaygCommand(program: Command): void {
  program
    .command('payg')
    .description('Show PAYG balance')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const config = loadConfig();
      const { name, account } = getActiveAccount(config, opts.json ?? false);
      try {
        const data = await api.getPayg(account.management_key, name);
        if (opts.json) { printJson(data); return; }
        renderSection('PAYG Balance');
        renderKV([
          ['Total', `$${data.total_credits.toFixed(2)}`],
          ['Top-up', `$${data.top_up_credits.toFixed(2)}    Bonus  $${data.bonus_credits.toFixed(2)}`],
        ]);
        console.log();
      } catch (e) {
        printError(e instanceof Error ? e.message : String(e), opts.json ?? false);
      }
    });
}

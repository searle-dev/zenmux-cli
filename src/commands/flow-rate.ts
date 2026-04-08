import { Command } from 'commander';
import { loadConfig, getActiveAccount } from '../lib/config';
import { api } from '../lib/api';
import { renderSection, renderKV, printJson, printError } from '../lib/render';

export function registerFlowRateCommand(program: Command): void {
  program
    .command('flow-rate')
    .description('Show Flow exchange rate')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const config = loadConfig();
      const { name, account } = getActiveAccount(config, opts.json ?? false);
      try {
        const data = await api.getFlowRate(account.management_key, name);
        if (opts.json) { printJson(data); return; }
        renderSection('Flow Rate');
        renderKV([
          ['Base', `$${data.base_usd_per_flow} / Flow`],
          ['Effective', `$${data.effective_usd_per_flow} / Flow`],
        ]);
        console.log();
      } catch (e) {
        printError(e instanceof Error ? e.message : String(e), opts.json ?? false);
      }
    });
}

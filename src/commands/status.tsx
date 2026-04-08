import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { loadConfig } from '../lib/config';
import { api } from '../lib/api';
import { printJson, printError } from '../lib/render';
import { StatusDisplay, type AccountResult } from '../components/StatusDisplay';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function settle<T>(p: Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await p };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show status for all accounts')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const json = opts.json ?? false;
      const config = loadConfig();
      const names = Object.keys(config.accounts);

      if (names.length === 0) {
        printError('No accounts configured. Run: zenmux account add', json);
      }

      const rawResults = await Promise.all(
        names.map(async (name) => {
          const account = config.accounts[name];
          const [subResult, paygResult, frResult] = await Promise.all([
            settle(api.getSubscription(account.management_key, name)),
            settle(api.getPayg(account.management_key, name)),
            settle(api.getFlowRate(account.management_key, name)),
          ]);
          return { name, isActive: name === config.active, subResult, paygResult, frResult };
        }),
      );

      if (json) {
        printJson(
          rawResults.map(({ name, isActive, subResult, paygResult, frResult }) => ({
            account: name,
            active: isActive,
            subscription: subResult.ok ? subResult.data : { error: subResult.error },
            payg: paygResult.ok ? paygResult.data : { error: paygResult.error },
            flow_rate: frResult.ok ? frResult.data : { error: frResult.error },
          })),
        );
        return;
      }

      const results: AccountResult[] = rawResults.map(
        ({ name, isActive, subResult, paygResult, frResult }) => ({
          name,
          isActive,
          sub: subResult.ok ? subResult.data : null,
          payg: paygResult.ok ? paygResult.data : null,
          fr: frResult.ok ? frResult.data : null,
          subError: subResult.ok ? null : subResult.error,
          paygError: paygResult.ok ? null : paygResult.error,
        }),
      );

      const { waitUntilExit } = render(<StatusDisplay results={results} />);
      await waitUntilExit();
    });
}

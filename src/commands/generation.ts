import { Command } from 'commander';
import { loadConfig, getActiveAccount } from '../lib/config';
import { api } from '../lib/api';
import { renderSection, renderKV, printJson, printError } from '../lib/render';

export function registerGenerationCommand(program: Command): void {
  program
    .command('generation <id>')
    .description('Show details of a generation record')
    .option('--json', 'Output raw JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      const config = loadConfig();
      const { name, account } = getActiveAccount(config, opts.json ?? false);

      if (!account.api_key) {
        printError(
          `Account "${name}" has no api_key. Remove and re-add: zenmux account remove ${name} && zenmux account add ${name}`,
          opts.json ?? false
        );
      }

      try {
        const data = await api.getGeneration(account.api_key!, id, name);
        if (opts.json) { printJson(data); return; }
        renderSection(`Generation  ${data.generationId}`);
        renderKV([
          ['Model', data.model],
          ['API', data.api],
          ['Created', new Date(data.createAt).toLocaleString()],
          ['Duration', `${data.generationTime.toLocaleString()} ms   Latency  ${data.latency.toLocaleString()} ms`],
          ['Tokens', `prompt: ${data.nativeTokens.prompt.toLocaleString()}  completion: ${data.nativeTokens.completion.toLocaleString()}  cached: ${data.nativeTokens.cached.toLocaleString()}`],
          ['Usage', `${data.usage} Flow`],
          ['Finish', data.finishReason],
        ]);
        console.log();
      } catch (e) {
        printError(e instanceof Error ? e.message : String(e), opts.json ?? false);
      }
    });
}

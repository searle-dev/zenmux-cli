import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { loadConfig } from '../lib/config';
import { api } from '../lib/api';

const CACHE_FILE = path.join(os.tmpdir(), 'zenmux-statusline-cache.txt');
const CACHE_TTL_MS = 60 * 1000;

function formatResetIn(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h${m}m` : `${m}m`;
}

function bar(pct: number, width = 8): string {
  const filled = Math.round(Math.min(pct, 1) * width);
  return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
}

function pctStr(pct: number): string {
  const s = (pct * 100).toFixed(0) + '%';
  if (pct > 0.9) return chalk.red(s);
  if (pct > 0.7) return chalk.yellow(s);
  return s;
}

async function fetchStatuslineText(): Promise<string> {
  const config = loadConfig();
  const name = config.active;

  if (!name || !config.accounts[name]) {
    return chalk.dim('◉ no active account') + '\n';
  }

  const account = config.accounts[name];

  try {
    const [sub, payg] = await Promise.all([
      api.getSubscription(account.management_key, name),
      api.getPayg(account.management_key, name).catch(() => null),
    ]);

    const p5h = sub.quota_5_hour.usage_percentage;
    const p7d = sub.quota_7_day.usage_percentage;
    const sep = chalk.dim(' · ');

    const parts: string[] = [
      chalk.bold('◉ ' + name),
      `5h ${bar(p5h)} ${pctStr(p5h)} ${chalk.dim(formatResetIn(sub.quota_5_hour.resets_at))}`,
      `7d ${bar(p7d)} ${pctStr(p7d)}`,
    ];

    if (payg !== null) {
      const amt = `$${payg.total_credits.toFixed(2)}`;
      parts.push('PAYG ' + (payg.total_credits < 10 ? chalk.yellow(amt) : chalk.bold(amt)));
    }

    return parts.join(sep) + '\n';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return chalk.dim(`◉ ${name} · ${msg}`) + '\n';
  }
}

function readCache(): string | null {
  try {
    const stat = fs.statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
      return fs.readFileSync(CACHE_FILE, 'utf-8');
    }
  } catch {}
  return null;
}

function writeCache(text: string): void {
  try { fs.writeFileSync(CACHE_FILE, text, 'utf-8'); } catch {}
}

function updateClaudeSettings(statusLine: { type: string; command: string } | null): void {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); } catch {}
  }

  if (statusLine === null) {
    delete settings.statusLine;
  } else {
    settings.statusLine = statusLine;
  }

  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

export function registerStatuslineCommand(program: Command): void {
  const statusline = program
    .command('statusline')
    .description('Manage Claude Code statusline integration');

  statusline
    .command('install')
    .description('Install ZenMux quota statusline in Claude Code')
    .action(async () => {
      updateClaudeSettings({ type: 'command', command: 'zenmux _statusline-fetch' });
      console.log(chalk.green('✓ Statusline installed in ~/.claude/settings.json'));

      process.stderr.write(chalk.dim('  Fetching initial data...\r'));
      const text = await fetchStatuslineText();
      writeCache(text);
      process.stderr.write(' '.repeat(30) + '\r');

      console.log(chalk.dim('  Preview:') + '  ' + text.trimEnd());
      console.log(chalk.dim('  Reload Claude Code to activate.'));
    });

  statusline
    .command('remove')
    .description('Remove ZenMux statusline from Claude Code')
    .action(() => {
      updateClaudeSettings(null);
      console.log(chalk.green('✓ Statusline removed from ~/.claude/settings.json'));
      console.log(chalk.dim('  Reload Claude Code to deactivate.'));
    });

  // Hidden — invoked by Claude Code on each assistant message
  program
    .command('_statusline-fetch', { hidden: true })
    .action(async () => {
      const cached = readCache();
      if (cached !== null) {
        process.stdout.write(cached);
        return;
      }
      const text = await fetchStatuslineText();
      writeCache(text);
      process.stdout.write(text);
    });
}

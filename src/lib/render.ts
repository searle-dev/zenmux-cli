import chalk from 'chalk';

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printError(message: string, json: boolean): never {
  if (json) {
    console.log(JSON.stringify({ error: message }));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(1);
}

export function renderSection(title: string): void {
  console.log(`\n  ${chalk.bold(title)}`);
  console.log('  ' + '─'.repeat(41));
}

export function renderKV(pairs: [string, string][]): void {
  for (const [k, v] of pairs) {
    console.log(`  ${k.padEnd(10)}${v}`);
  }
}

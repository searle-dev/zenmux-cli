import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CLAUDE_SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');

export function writeClaudeSettings(apiKey: string, baseUrl: string): void {
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(CLAUDE_SETTINGS)) {
    settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf-8'));
  }

  if (!settings.env || typeof settings.env !== 'object') {
    settings.env = {};
  }

  (settings.env as Record<string, string>).ANTHROPIC_AUTH_TOKEN = apiKey;
  (settings.env as Record<string, string>).ANTHROPIC_BASE_URL = baseUrl;

  const dir = path.dirname(CLAUDE_SETTINGS);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2), 'utf-8');
}

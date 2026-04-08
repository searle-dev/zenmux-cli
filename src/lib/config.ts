import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { printError } from './render';

export interface AccountConfig {
  management_key: string;
  api_key?: string;
  base_url: string;
}

export interface ZenmuxConfig {
  active: string | null;
  accounts: Record<string, AccountConfig>;
}

const CONFIG_DIR = path.join(os.homedir(), '.zenmux-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: ZenmuxConfig = { active: null, accounts: {} };
const DEFAULT_BASE_URL = 'https://zenmux.ai/api/anthropic';

export function loadConfig(): ZenmuxConfig {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveConfig(config: ZenmuxConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getActiveAccount(config: ZenmuxConfig, json = false): { name: string; account: AccountConfig } {
  if (!config.active || !config.accounts[config.active]) {
    printError('No active account. Run: zenmux account add', json);
  }
  return { name: config.active, account: config.accounts[config.active] };
}

export { DEFAULT_BASE_URL };

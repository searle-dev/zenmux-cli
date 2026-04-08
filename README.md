# zenmux-cli

CLI tool for managing ZenMux accounts — query quotas, switch API keys into Claude Code, and monitor usage via a live statusline.

## Install

```bash
npm install -g .
# or during development
npm link
```

Requires Node.js ≥ 20.12.

---

## Account Management

### Add an account

Keys are masked during input — only the first and last few characters are visible:

```
$ zenmux account add personal

? Management Key (required):  sk-mg-v****5a3f
? API Key (optional, press enter to skip):  sk-ss-v****c819
? Base URL (default: https://zenmux.ai/api/anthropic):
✓ Account "personal" added.
  Set as active account.
```

### List accounts

```
$ zenmux account list

* personal
  work     (no api_key)
```

`*` marks the active account. Accounts without an `api_key` cannot be switched to.

### Switch active account

Without an argument, an interactive picker appears:

```
$ zenmux account use

? Select account to activate:
❯ personal  (current)
  work

✓ Switched to account "work".
  Claude Code updated: ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL set.
```

Or pass the name directly: `zenmux account use personal`

---

## Status

Shows all accounts side-by-side with live quota and balance data:

```
$ zenmux status

╭──────────────────────────────────────────────────────────────────────────────╮
│ ● personal (active)                                                          │
│ ZenMux Ultra  ·  800 Flows/5h  ·  [healthy]                                 │
│ Worth $1,367/mo  ·  $200/month  ·  Renews Apr 27, 11:42 AM                  │
│                                                                              │
│ 5-Hour Window              Current Week                   PAYG Balance       │
│ Resets in 4h 36m           Resets Apr 13, 12:17 PM        $85.80            │
│ █░░░░░░░░░░░░░░░░░░░       ████░░░░░░░░░░░░░░░░           top-up  $0.00     │
│ 6%  50 / 800 flows         20%  1,240 / 6,182 flows       bonus   $85.80    │
│                                                           $0.0516 / Flow    │
╰──────────────────────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────╮
│ ○ work                                                                       │
│ ZenMux Ultra  ·  800 Flows/5h  ·  [healthy]                                 │
│ Worth $870/mo  ·  $200/month  ·  Renews May 6, 12:15 PM                     │
│                                                                              │
│ 5-Hour Window              Current Week                   PAYG Balance       │
│ Resets in now              Resets Apr 11, 9:36 PM         $13.82            │
│ ░░░░░░░░░░░░░░░░░░░░       ██████████░░░░░░░░░░           top-up  $0.00     │
│ 0%  0 / 800 flows          48%  2,962 / 6,182 flows       bonus   $13.82    │
│                                                           $0.033 / Flow     │
╰──────────────────────────────────────────────────────────────────────────────╯
```

Active account has a green border. All accounts are fetched concurrently.

---

## Claude Code Statusline

Install a live quota bar at the bottom of every Claude Code session:

```
$ zenmux statusline install

✓ Statusline installed in ~/.claude/settings.json
  Preview:  ◉ personal · 5h █░░░░░░░ 6% 4h36m · 7d ██░░░░░░ 20% · PAYG $85.80
  Reload Claude Code to activate.
```

The statusline updates after every assistant message:

```
◉ personal · 5h ████░░░░ 43% 2h10m · 7d ████████░░░░░░░░ 78% · PAYG $85.80
```

Usage thresholds:
- **> 70%** → yellow
- **> 90%** → red
- **PAYG < $10** → yellow

Data is cached for 60 seconds — the first call per minute hits the API, subsequent calls within the window are instant.

```bash
zenmux statusline install   # write to ~/.claude/settings.json + pre-fill cache
zenmux statusline remove    # remove statusline config
```

---

## Other Query Commands

```bash
zenmux flow-rate            # current Flow exchange rate
zenmux payg                 # PAYG balance breakdown
zenmux generation <id>      # single generation record detail
```

All query commands accept `--json` for script/skill integration:

```bash
zenmux status --json | jq '.[0].subscription.quota_5_hour'
```

---

## Shell Completion

```bash
zenmux completion --install   # detect shell and append to rc file
source ~/.zshrc               # apply without restarting
```

Covers:
- `zenmux <TAB>` → all top-level commands
- `zenmux account <TAB>` → `list` / `add` / `remove` / `use`
- `zenmux account use <TAB>` → account names from your config (dynamic)
- `zenmux account remove <TAB>` → same

Manual output for a specific shell:

```bash
zenmux completion zsh
zenmux completion bash
zenmux completion fish
```

---

## Config

Accounts are stored in `~/.zenmux-cli/config.json`:

```json
{
  "active": "personal",
  "accounts": {
    "personal": {
      "management_key": "sk-mg-...",
      "api_key": "sk-ss-v1-...",
      "base_url": "https://zenmux.ai/api/anthropic"
    },
    "work": {
      "management_key": "sk-mg-...",
      "api_key": "sk-ss-v1-...",
      "base_url": "https://zenmux.ai/api/anthropic"
    }
  }
}
```

- `management_key` — required; used for all quota/balance queries
- `api_key` — optional; required for `account use` and `generation`
- `base_url` — defaults to `https://zenmux.ai/api/anthropic`

`zenmux account use <name>` writes `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` into `~/.claude/settings.json`, merging safely with any existing content.

# zenmux-cli

CLI tool for managing ZenMux accounts and querying account info.

## Install

```bash
npm install -g .
# or
npm link
```

## Commands

```bash
# Account management
zenmux account list
zenmux account add <name>
zenmux account remove <name>
zenmux account use [name]       # interactive picker if name omitted; switches active account + updates Claude Code

# Query (all support --json)
zenmux status                   # all accounts: subscription, quotas, PAYG
zenmux flow-rate                # Flow exchange rate
zenmux payg                     # PAYG balance
zenmux generation <id>          # single generation record

# Claude Code statusline
zenmux statusline install       # install quota statusline in Claude Code
zenmux statusline remove        # remove statusline

# Shell completion
zenmux completion --install     # auto-detect shell (zsh/bash/fish) and install
zenmux completion zsh           # print zsh completion script
```

## Claude Code Statusline

After running `zenmux statusline install`, Claude Code's status bar shows real-time quota info for the active account:

```
◉ myaccount · 5h █░░░░░░░ 17% 3h35m · 7d ██░░░░░░ 21% · PAYG $85.80
```

- Usage turns **yellow** above 70%, **red** above 90%
- PAYG balance turns **yellow** below $10
- Data is cached for 60 seconds; first call per minute fetches live from API
- Reload Claude Code after install/remove to apply

## Shell Completion

```bash
zenmux completion --install   # appends eval line to ~/.zshrc / ~/.bashrc / ~/.config/fish/config.fish
source ~/.zshrc               # reload without restarting shell
```

Completes commands, subcommands, and account names dynamically.

## Config

Accounts stored in `~/.zenmux-cli/config.json`:

```json
{
  "active": "personal",
  "accounts": {
    "personal": {
      "management_key": "sk-mg-...",
      "api_key": "sk-ss-v1-...",
      "base_url": "https://zenmux.ai/api/anthropic"
    }
  }
}
```

`account use` writes `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` to `~/.claude/settings.json`.

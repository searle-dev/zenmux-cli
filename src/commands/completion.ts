import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';

function detectShell(): string {
  const shell = process.env.SHELL ?? '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  return 'bash';
}

function zshScript(): string {
  return `
_zenmux() {
  local -a commands account_cmds accounts

  commands=(
    'account:Manage ZenMux accounts'
    'status:Show status for all accounts'
    'flow-rate:Show current Flow rate'
    'payg:Show PAYG balance'
    'generation:Show a generation record'
    'completion:Output shell completion script'
  )

  account_cmds=(
    'list:List all accounts'
    'add:Add a new account'
    'remove:Remove an account'
    'use:Switch active account'
  )

  if (( CURRENT == 2 )); then
    _describe 'command' commands
    return
  fi

  if (( CURRENT == 3 )) && [[ $words[2] == 'account' ]]; then
    _describe 'account command' account_cmds
    return
  fi

  if (( CURRENT == 4 )) && [[ $words[2] == 'account' ]] && [[ $words[3] == (use|remove) ]]; then
    accounts=(\${(f)"\$(zenmux account _names 2>/dev/null)"})
    _describe 'account' accounts
    return
  fi
}

compdef _zenmux zenmux
`.trimStart();
}

function bashScript(): string {
  return `
_zenmux_completion() {
  local cur prev cmd subcmd
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  cmd="\${COMP_WORDS[1]}"
  subcmd="\${COMP_WORDS[2]}"

  if [[ \${COMP_CWORD} == 1 ]]; then
    COMPREPLY=(\$(compgen -W "account status flow-rate payg generation completion" -- "\$cur"))
    return
  fi

  if [[ \$cmd == "account" ]]; then
    if [[ \${COMP_CWORD} == 2 ]]; then
      COMPREPLY=(\$(compgen -W "list add remove use" -- "\$cur"))
      return
    fi
    if [[ \$subcmd == "use" || \$subcmd == "remove" ]]; then
      local accounts
      accounts=\$(zenmux account _names 2>/dev/null)
      COMPREPLY=(\$(compgen -W "\$accounts" -- "\$cur"))
      return
    fi
  fi
}

complete -F _zenmux_completion zenmux
`.trimStart();
}

function fishScript(): string {
  return `
set -l zenmux_cmds account status flow-rate payg generation completion
set -l account_cmds list add remove use

complete -c zenmux -f
complete -c zenmux -n "__fish_use_subcommand" -a "\$zenmux_cmds"
complete -c zenmux -n "__fish_seen_subcommand_from account" -n "__fish_use_subcommand" -a "\$account_cmds"
complete -c zenmux -n "__fish_seen_subcommand_from account; and __fish_seen_subcommand_from use remove" \\
  -a "(zenmux account _names 2>/dev/null)"
`.trimStart();
}

function getScript(shell: string): string {
  switch (shell) {
    case 'zsh': return zshScript();
    case 'fish': return fishScript();
    default: return bashScript();
  }
}

function rcFile(shell: string): string {
  switch (shell) {
    case 'zsh': return path.join(os.homedir(), '.zshrc');
    case 'fish': return path.join(os.homedir(), '.config', 'fish', 'config.fish');
    default: return path.join(os.homedir(), '.bashrc');
  }
}

function evalLine(shell: string): string {
  if (shell === 'fish') {
    return 'zenmux completion fish | source';
  }
  return `eval "$(zenmux completion)"`;
}

export function registerCompletionCommand(program: Command): void {
  program
    .command('completion [shell]')
    .description('Output shell completion script (zsh, bash, fish)')
    .option('--install', 'Append eval line to shell rc file')
    .action((shell: string | undefined, opts: { install?: boolean }) => {
      const resolved = shell ?? detectShell();

      if (opts.install) {
        const rc = rcFile(resolved);
        const line = evalLine(resolved);
        const existing = fs.existsSync(rc) ? fs.readFileSync(rc, 'utf-8') : '';
        if (existing.includes('zenmux completion')) {
          console.log(chalk.dim(`Already installed in ${rc}`));
          return;
        }
        fs.appendFileSync(rc, `\n# zenmux shell completion\n${line}\n`);
        console.log(chalk.green(`✓ Installed completion in ${rc}`));
        console.log(chalk.dim(`  Restart your shell or run: source ${rc}`));
        return;
      }

      process.stdout.write(getScript(resolved));
    });
}

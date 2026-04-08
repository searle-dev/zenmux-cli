<div align="center">

# zenmux-cli

**在终端管理 ZenMux 账号 — 查询配额、一键切换 Claude Code API Key、实时状态栏监控余量。**

[English](README.md)

![Node.js](https://img.shields.io/badge/node-%3E%3D20.12-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-lightgrey?style=flat-square)

</div>

---

## 安装

```bash
npm install -g .
# 开发中可用
npm link
```

---

## 账号管理

### 添加账号

输入 Key 时自动脱敏，仅显示头尾字符：

```
$ zenmux account add personal

? Management Key (required):  sk-mg-v****5a3f
? API Key (optional, press enter to skip):  sk-ss-v****c819
? Base URL (default: https://zenmux.ai/api/anthropic):
✓ Account "personal" added.
  Set as active account.
```

### 查看账号列表

```
$ zenmux account list

* personal
  work     (no api_key)
```

`*` 标记当前激活账号。未设置 `api_key` 的账号无法切换。

### 切换账号

不带参数时弹出交互式选择器：

```
$ zenmux account use

? Select account to activate:
❯ personal  (current)
  work

✓ Switched to account "work".
  Claude Code updated: ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL set.
```

也可直接传名称：`zenmux account use personal`

---

## 状态概览

并发查询所有账号，每个账号展示为独立卡片：

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
│ 6%   50 / 800 flows        20%  1,240 / 6,182 flows       bonus   $85.80    │
│                                                           $0.052 / Flow     │
╰──────────────────────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────╮
│ ○ work                                                                       │
│ ZenMux Ultra  ·  800 Flows/5h  ·  [healthy]                                 │
│ Worth $870/mo  ·  $200/month  ·  Renews May 6, 12:15 PM                     │
│                                                                              │
│ 5-Hour Window              Current Week                   PAYG Balance       │
│ Resets in now              Resets Apr 11, 9:36 PM         $13.82            │
│ ░░░░░░░░░░░░░░░░░░░░       ██████████░░░░░░░░░░           top-up  $0.00     │
│ 0%   0 / 800 flows         48%  2,962 / 6,182 flows       bonus   $13.82    │
│                                                           $0.033 / Flow     │
╰──────────────────────────────────────────────────────────────────────────────╯
```

激活账号显示绿色边框。单个账号请求失败时，其卡片展示错误信息，其余账号正常渲染。

加 `--json` 输出原始数据，方便脚本/Skill 调用：

```bash
zenmux status --json | jq '.[0].subscription.quota_5_hour'
```

---

## Claude Code 状态栏

一键在每个 Claude Code 会话底部安装余量监控状态栏：

```
$ zenmux statusline install

✓ Statusline installed in ~/.claude/settings.json
  Preview:  ◉ personal · 5h █░░░░░░░ 6% 4h36m · 7d ██░░░░░░ 20% · PAYG $85.80
  Reload Claude Code to activate.
```

安装后，状态栏显示在 Claude Code 底部，每次 AI 回复后自动刷新：

```
◉ personal · 5h ████░░░░ 43% 2h10m · 7d ████████░░░░░░░░ 78% · PAYG $85.80
```

| 用量 | 颜色提示 |
|------|---------|
| > 70% | 黄色 |
| > 90% | 红色 |
| PAYG 余额 < $10 | 黄色 |

数据缓存 60 秒 — 每分钟第一次调用请求 API，窗口内后续调用直接读缓存，响应极快。

```bash
zenmux statusline install   # 安装并预填充缓存
zenmux statusline remove    # 从 Claude Code 移除
```

---

## 其他查询命令

```bash
zenmux flow-rate            # 当前 Flow 汇率
zenmux payg                 # PAYG 余额明细
zenmux generation <id>      # 查询单条生成记录
```

均支持 `--json`。

---

## 命令补全

```bash
zenmux completion --install   # 自动检测 shell（zsh/bash/fish）并写入 rc 文件
source ~/.zshrc               # 无需重启即可生效
```

补全覆盖范围：

| 输入 | 补全内容 |
|------|---------|
| `zenmux <TAB>` | 所有顶级命令 |
| `zenmux account <TAB>` | `list` `add` `remove` `use` |
| `zenmux account use <TAB>` | 账号名（实时读取配置） |
| `zenmux account remove <TAB>` | 账号名（实时读取配置） |

手动输出补全脚本：

```bash
zenmux completion zsh
zenmux completion bash
zenmux completion fish
```

---

## 配置

账号信息存储于 `~/.zenmux-cli/config.json`：

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

| 字段 | 必填 | 说明 |
|------|------|------|
| `management_key` | ✓ | 用于所有配额 / 余额查询 |
| `api_key` | — | `account use` 和 `generation` 命令需要 |
| `base_url` | — | 默认 `https://zenmux.ai/api/anthropic` |

执行 `zenmux account use <name>` 会将 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL` 安全合并写入 `~/.claude/settings.json`，不影响文件中其他已有配置。

# ZeroClaw 生产部署操作指南

> 本文档记录在 Jetson 真机上部署 Sparkbox 时，需要对 ZeroClaw 进行的全部配置操作。
> 基于 ZeroClaw v0.6.8 验证。

---

## 1. 安装 ZeroClaw

Jetson (Ubuntu 22.04 ARM64) 需要源码编译，因为预编译二进制依赖 GLIBC 2.39+，而 Jetson 系统版本较低。

```bash
# 先安装 Rust（如果没有）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 安装 ZeroClaw（强制源码编译）
curl -sSL https://get.zeroclaw.dev | bash -s -- --force-source-build

# 验证
~/.cargo/bin/zeroclaw --version
# → zeroclaw 0.6.8
```

## 2. 初始化 ZeroClaw（首次 onboard）

```bash
~/.cargo/bin/zeroclaw onboard
```

onboard 向导会要求你配置：

- **Provider**: 选择 `openai`（用于 OpenRouter 兼容接口），或直接选 `openrouter`
- **Base URL**: 填 OpenRouter 的地址 `https://openrouter.ai/api/v1`
- **API Key**: 填 OpenRouter 密钥（会被加密存储在 config.toml 中）
- **Default Model**: 填 `openrouter/auto`（OpenRouter 自动路由）或指定模型如 `deepseek/deepseek-chat`

> **重要**: API Key 加密与 config.toml 的路径绑定。如果移动了 `~/.zeroclaw/config.toml` 到其他路径，密钥解密会失败。后续如需修改 provider/key，使用 `zeroclaw onboard --reinit`。

onboard 完成后，验证连通性：

```bash
~/.cargo/bin/zeroclaw agent -m "Reply exactly: OK"
# → OK
```

## 3. 修改 autonomy 级别为 full

Sparkbox 以非交互方式调用 ZeroClaw（`-m` 单消息模式），需要 ZeroClaw 能自动执行所有工具，不等待人工审批。

编辑 `~/.zeroclaw/config.toml`，找到 `[autonomy]` 段：

```toml
[autonomy]
level = "full"          # ← 改为 "full"（原值 "supervised"）
workspace_only = true   # ← 保持 true，限制只能操作工作区
```

### 各级别含义

| 级别 | 行为 | 适用场景 |
|---|---|---|
| `read_only` | 只能读取，不能写入/执行 | 纯查询 |
| `supervised` | 需要人工逐个审批工具调用 | 交互式使用 |
| `full` | 自动执行所有工具（受 workspace_only 限制） | **Sparkbox 生产部署** |

### 安全性说明

`level = "full"` 配合 `workspace_only = true` 意味着：
- ZeroClaw 可以自由读写**工作区内**的文件
- ZeroClaw **不能**访问 `forbidden_paths` 中的系统目录
- 所有操作受 `max_actions_per_hour` (20) 和 `max_cost_per_day_cents` (500) 限制
- 审计日志始终开启 (`security.audit.enabled = true`)

## 4. 确认 allowed_commands

`[autonomy]` 段的 `allowed_commands` 控制 ZeroClaw 的 `shell` 工具能执行哪些命令。默认列表已包含常用命令，确认存在以下关键项：

```toml
allowed_commands = [
    "ls", "cat", "grep", "find", "echo", "pwd",
    "wc", "head", "tail", "date",
    "python", "python3",
    # 根据需要添加
]
```

## 5. 配置 Sparkbox Jetson 的 .env

在 Sparkbox Jetson 项目的 `.env` 中设置 ZeroClaw 路径：

```bash
# ZeroClaw 二进制路径（Jetson 真机上直接运行，不走 WSL）
ZEROCLAW_BIN=/home/nvidia/.cargo/bin/zeroclaw

# ZeroClaw 配置目录（含加密 API Key 的 config.toml）
ZEROCLAW_CONFIG_DIR=/home/nvidia/.zeroclaw

# 推理 API（Wiki rebuild 用的 OpenAI 兼容接口）
# 如果 Jetson 上有本地 Ollama，可以不设这三项（走默认 Ollama）
# 如果需要走 OpenRouter：
INFERENCE_BASE_URL=https://openrouter.ai/api/v1
INFERENCE_API_KEY=sk-or-v1-xxxxx
INFERENCE_MODEL=deepseek/deepseek-chat

# Ollama（聊天回退 & 本地离线场景）
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_DEFAULT_MODEL=qwen3.5:9b
```

### 开发环境（Windows + WSL）vs 生产环境（Jetson）差异

| 配置项 | 开发 (Windows) | 生产 (Jetson) |
|---|---|---|
| `ZEROCLAW_BIN` | `scripts/zeroclaw-wsl.cmd`（WSL 代理） | `/home/nvidia/.cargo/bin/zeroclaw` |
| `ZEROCLAW_CONFIG_DIR` | `C:\Users\xxx\.zeroclaw`（Windows 路径） | `/home/nvidia/.zeroclaw` |
| `ZEROCLAW_CONFIG_DIR_LINUX` | `/home/ubuntu/.zeroclaw`（WSL 路径） | 留空（不需要跨系统路径转换） |
| 代理 | WSL NAT 不需要代理（代码自动清除） | Jetson 按网络环境配置 |

## 6. 网络代理配置（如需翻墙）

### 场景 A：Jetson 有直接互联网访问

不需要任何代理配置。`.env` 中保持：

```bash
APP_OUTBOUND_PROXY_ENABLED=false
```

### 场景 B：Jetson 需要代理访问 OpenRouter

```bash
APP_OUTBOUND_PROXY_ENABLED=true
APP_OUTBOUND_HTTP_PROXY=http://127.0.0.1:7890
APP_OUTBOUND_HTTPS_PROXY=http://127.0.0.1:7890
```

同时需要让 ZeroClaw 也使用代理。编辑 `~/.zeroclaw/config.toml`：

```toml
[autonomy]
shell_env_passthrough = ["http_proxy", "https_proxy", "no_proxy"]
```

并在 Sparkbox 的 systemd service 中注入代理环境变量：

```ini
[Service]
Environment="http_proxy=http://127.0.0.1:7890"
Environment="https_proxy=http://127.0.0.1:7890"
Environment="no_proxy=127.0.0.1,localhost,::1"
```

### 场景 C：Jetson 使用 Ollama 本地推理（无需外网）

```bash
APP_OUTBOUND_PROXY_ENABLED=false
INFERENCE_BASE_URL=http://127.0.0.1:11434/v1
INFERENCE_API_KEY=
INFERENCE_MODEL=qwen3.5:9b
```

ZeroClaw 的 `config.toml` 也需要指向本地 Ollama：

```bash
~/.cargo/bin/zeroclaw onboard --reinit
# Provider: openai
# Base URL: http://127.0.0.1:11434/v1
# Model: qwen3.5:9b
```

## 7. 验证部署

### 7.1 单独验证 ZeroClaw

```bash
# 基础连通
~/.cargo/bin/zeroclaw agent -m "Reply exactly: OK"

# 验证工具自动执行（full mode）
~/.cargo/bin/zeroclaw agent -m "List all files in your workspace using the shell tool"
# 应该自动执行 find/ls，不弹确认
```

### 7.2 验证 Sparkbox 隔离工作区

```bash
# 启动 Sparkbox Jetson
python -m uvicorn main:app --host 0.0.0.0 --port 8080

# 模拟调用（替换 token 和 user_id）
curl -X POST http://localhost:8080/api/device-agent/wiki/organize \
  -H "Authorization: Bearer <device-agent-token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "space_type": "private", "space_id": "<space_id>"}'
```

检查用户工作区是否正确创建：

```bash
ls data/zeroclaw_workspaces/<user_id>/workspace/
# 应包含: AGENTS.md  IDENTITY.md  WIKI.md  SOUL.md  MEMORY.md
#         TOOLS.md  USER.md  HEARTBEAT.md  user_raw_file/  work/
```

### 7.3 验证 ZeroClaw 自迭代

```bash
export ZEROCLAW_WORKSPACE=$(pwd)/data/zeroclaw_workspaces/<user_id>
~/.cargo/bin/zeroclaw --config-dir ~/.zeroclaw agent \
  -m "Read USER.md, update it with a test preference, then confirm"

# 检查 USER.md 是否被修改
cat data/zeroclaw_workspaces/<user_id>/workspace/USER.md
```

## 8. config.toml 关键配置参考

以下是影响 Sparkbox 运行的 `~/.zeroclaw/config.toml` 关键段落和推荐值：

```toml
# === 模型配置 ===
default_provider = "openai"                    # 或 "openrouter"
default_model = "openrouter/auto"              # 或具体模型
default_temperature = 0.7
provider_timeout_secs = 120

[model_providers.openai]
base_url = "https://openrouter.ai/api/v1"     # 生产环境的推理 API

# === 自治配置（最关键）===
[autonomy]
level = "full"                                 # 必须为 full
workspace_only = true                          # 必须为 true
max_actions_per_hour = 20                      # 按负载调整
max_cost_per_day_cents = 500                   # 成本保护

# === Agent 配置 ===
[agent]
max_tool_iterations = 10                       # 单次调用最大工具轮数
max_context_tokens = 32000                     # 上下文窗口

# === 记忆系统 ===
[memory]
backend = "sqlite"                             # SQLite 持久化
auto_save = true                               # 自动保存对话记忆
hygiene_enabled = true                         # 自动清理旧记忆

# === 安全审计 ===
[security.audit]
enabled = true                                 # 保持开启
log_path = "audit.log"

# === 可靠性 ===
[reliability]
provider_retries = 2                           # API 重试次数
provider_backoff_ms = 500                      # 重试退避
```

## 9. 故障排查

| 问题 | 原因 | 解决 |
|---|---|---|
| `All providers/models failed` | 网络不通或代理配置错误 | 检查 `curl https://openrouter.ai/api/v1/models` 是否返回 200 |
| `Unknown config key: api_key` | ZeroClaw 版本差异的 warning | 可忽略，不影响运行 |
| `file_write` 弹出 `[Y/N]` 确认 | autonomy level 不是 `full` | 检查 config.toml `[autonomy] level = "full"` |
| 工具执行超时 | `shell_timeout_secs` 太短 | 增大 `[autonomy] shell_timeout_secs = 120` |
| 加密 API Key 解密失败 | config.toml 被移动到其他路径 | 在原路径运行 `zeroclaw onboard --reinit` 重新设置 |
| Wiki rebuild 返回 400 | OpenRouter 模型名格式错误 | `INFERENCE_MODEL` 必须含 provider 前缀，如 `deepseek/deepseek-chat` |
| 记忆相关错误 | brain.db 损坏 | 删除 `data/zeroclaw_workspaces/<user_id>/memory/brain.db`，ZeroClaw 会自动重建 |

## 10. Sparkbox 如何调用 ZeroClaw（内部机制简述）

```
Sparkbox Jetson (FastAPI)
│
├── 交互式 Agent（聊天、文件整理、质量优化）
│   └── ZEROCLAW_WORKSPACE={user_home} \
│       zeroclaw --config-dir ~/.zeroclaw agent -m "..."
│       → 使用 ZeroClaw 完整工具链（file_read/write, memory, shell）
│       → 工作区隔离到 data/zeroclaw_workspaces/{user_id}/workspace/
│       → ZeroClaw 可自由读写 USER.md, MEMORY.md, SOUL.md 等实现自迭代
│
├── Wiki 结构化重建
│   └── 直接调用 OpenAI-compatible API（跳过 ZeroClaw）
│       → 因为需要精确控制 JSON 输出格式
│       → 使用 INFERENCE_BASE_URL / INFERENCE_API_KEY / INFERENCE_MODEL
│
└── 聊天流式输出
    └── 通过 services/ollama.py 双模式路由
        → 有 INFERENCE_API_KEY → OpenAI SSE 流式
        → 无 INFERENCE_API_KEY → Ollama 原生流式
```

每个用户的隔离工作区目录结构：

```
data/zeroclaw_workspaces/{user_id}/           ← ZEROCLAW_WORKSPACE 指向此处
├── workspace/                                 ← ZeroClaw 实际操作目录
│   ├── AGENTS.md                              — 行为规则（不可变核心 + 可迭代策略）
│   ├── IDENTITY.md                            — 身份角色描述
│   ├── WIKI.md                                — 增量知识索引
│   ├── SOUL.md                                — 人格定义、沟通风格
│   ├── MEMORY.md                              — 长期记忆框架
│   ├── TOOLS.md                               — 工具使用笔记
│   ├── USER.md                                — 用户档案
│   ├── HEARTBEAT.md                           — 定期任务（空）
│   ├── user_raw_file/                         — 指针文件 (.ptr.json)
│   └── work/                                  — 临时工作目录
├── memory/
│   └── brain.db                               — ZeroClaw SQLite 记忆库
├── sessions/                                  — 会话历史
└── state/                                     — 运行时状态
```
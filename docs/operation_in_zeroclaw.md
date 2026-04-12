# ZeroClaw 生产部署操作指南

> 本文档记录在 Jetson 真机上部署 Sparkbox 时，需要对 ZeroClaw 进行的全部配置操作。
> 基于 ZeroClaw v0.6.8 验证。

---

## 0. 部署架构概览

```
Jetson (Ubuntu 22.04 ARM64, 原生 Linux)
│
├── Sparkbox Jetson (FastAPI, systemd 服务)           ← /home/nvidia/Documents/projects/clawbox/
│   ├── main.py                                       ← uvicorn 入口
│   ├── .env                                          ← 所有运行时配置
│   └── data/
│       ├── clawbox.db                                ← 应用数据库
│       ├── person_space/                             ← 用户原始文件
│       │   └── family/spaces/{space_id}/raw/         ← 上传的文档、图片等
│       └── zeroclaw_workspaces/                      ← 每用户隔离工作区
│           └── {user_id}/                            ← ZEROCLAW_WORKSPACE 指向此处
│               ├── workspace/                        ← ZeroClaw 实际操作目录
│               │   ├── AGENTS.md, WIKI.md, ...       ← 核心文件（Sparkbox 自动创建）
│               │   └── user_raw_file/*.ptr.json      ← 指针文件 → raw/ 实际文件
│               ├── memory/brain.db                   ← ZeroClaw 记忆库
│               ├── sessions/                         ← 会话历史
│               └── state/                            ← 运行时状态
│
├── ZeroClaw 二进制                                   ← /home/nvidia/.cargo/bin/zeroclaw
├── ZeroClaw 全局配置                                 ← /home/nvidia/.zeroclaw/config.toml
│                                                       （含加密 API Key, autonomy 策略等）
├── Ollama                                            ← /usr/local/bin/ollama (可选离线推理)
└── Tailscale                                         ← 远程连接通道
```

**关键理解**：

- **ZeroClaw 全局配置**（`~/.zeroclaw/config.toml`）：存 provider、API Key、autonomy 级别。所有用户共享。
- **ZeroClaw 工作区**（`data/zeroclaw_workspaces/{user_id}/`）：每用户独立。Sparkbox 在调用 ZeroClaw 时通过 `ZEROCLAW_WORKSPACE` 环境变量指定。
- **生产环境是原生 Linux**：不涉及 WSL，所有路径都是 Linux 路径，环境变量直接传递，没有跨系统转换问题。

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

Sparkbox 的 `.env` 文件控制所有运行时行为。以下是与 ZeroClaw 相关的完整配置。

### 5.1 完整 .env 示例（生产环境）

```bash
# === 基础服务 ===
HOST=0.0.0.0
PORT=8080
DEBUG=false

# === 认证 ===
BOOTSTRAP_OWNER_USERNAME=owner
BOOTSTRAP_OWNER_PASSWORD=<强密码>
SESSION_TTL_HOURS=336
API_TOKEN=<随机token>
DEVICE_AGENT_BEARER_TOKEN=<随机token>
DEVICE_PAIRING_SHARED_SECRET=<随机secret>

# === ZeroClaw 路径（生产环境：原生 Linux 路径，不涉及 WSL）===
ZEROCLAW_BIN=/home/nvidia/.cargo/bin/zeroclaw
ZEROCLAW_CONFIG_DIR=/home/nvidia/.zeroclaw
# ZEROCLAW_CONFIG_DIR_LINUX= ← 留空！只有 Windows+WSL 开发环境才需要此项

# === 本地推理（Ollama）===
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_DEFAULT_MODEL=qwen3.5:9b

# === 远程推理 API（Wiki rebuild + chat fallback）===
# 方案 A：走 OpenRouter
INFERENCE_BASE_URL=https://openrouter.ai/api/v1
INFERENCE_API_KEY=sk-or-v1-xxxxx
INFERENCE_MODEL=deepseek/deepseek-chat

# 方案 B：走本地 Ollama（无需外网）
# INFERENCE_BASE_URL=http://127.0.0.1:11434/v1
# INFERENCE_API_KEY=
# INFERENCE_MODEL=qwen3.5:9b

# === 网络代理（仅当 Jetson 需要翻墙时设置）===
APP_OUTBOUND_PROXY_ENABLED=false
# APP_OUTBOUND_HTTP_PROXY=http://127.0.0.1:7890
# APP_OUTBOUND_HTTPS_PROXY=http://127.0.0.1:7890
```

### 5.2 生产环境 vs 开发环境配置差异

| 配置项 | 开发环境 (Windows) | 生产环境 (Jetson Linux) |
|---|---|---|
| `ZEROCLAW_BIN` | `scripts/zeroclaw-wsl.cmd` | `/home/nvidia/.cargo/bin/zeroclaw` |
| `ZEROCLAW_CONFIG_DIR` | `C:\Users\xxx\.zeroclaw` | `/home/nvidia/.zeroclaw` |
| `ZEROCLAW_CONFIG_DIR_LINUX` | `/home/ubuntu/.zeroclaw` | **留空**（不需要） |
| `ZEROCLAW_WORKSPACE` 传递 | 需 `WSLENV` 跨 WSL 边界转发 | **直接生效**（原生 Linux 进程继承） |
| 路径格式 | Windows→WSL 需 `_windows_to_wsl_path()` 转换 | 全程 Linux 路径，无转换 |
| 代理 | WSL NAT 不能用 localhost 代理，代码自动清除 | 按实际网络配置 |

### 5.3 路径传递机制详解（为什么生产环境更简单）

Sparkbox 调用 ZeroClaw 的核心代码：

```python
# services/zeroclaw_workspace.py

# 1. 计算用户 workspace 路径
home = zeroclaw_home(user_id)
# → /home/nvidia/Documents/projects/clawbox/data/zeroclaw_workspaces/{user_id}

# 2. 判断是否 WSL（生产环境：否）
is_wsl = Path(binary).suffix.lower() == ".cmd"  # → False

# 3. 设置环境变量（生产环境：直接用 Linux 路径）
env["ZEROCLAW_WORKSPACE"] = str(home)
# → /home/nvidia/Documents/projects/clawbox/data/zeroclaw_workspaces/{user_id}

# 4. 调用 ZeroClaw（原生进程，直接继承 env）
zeroclaw --config-dir /home/nvidia/.zeroclaw agent -m "..."
# ZeroClaw 读取 ZEROCLAW_WORKSPACE → 操作正确的用户工作区
```

在生产环境（原生 Linux）中：
- `ZEROCLAW_BIN` 直接指向二进制，没有 `.cmd` 后缀 → `is_wsl = False`
- 所有路径都是 Linux 路径 → 不需要 `_windows_to_wsl_path()` 转换
- `ZEROCLAW_WORKSPACE` 作为普通 env var 传递给子进程 → 直接生效，不需要 `WSLENV`
- ZeroClaw 读到正确的 workspace → 操作 `data/zeroclaw_workspaces/{user_id}/workspace/`

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

## 7. 生产环境部署：完整步骤

以下是在一台全新的 Jetson 上从零部署 Sparkbox + ZeroClaw 的完整流程。

### 7.1 前置条件

```bash
# 确认系统信息
cat /etc/os-release   # Ubuntu 22.04
uname -m              # aarch64
nvidia-smi            # 确认 GPU 可用（可选）

# 确认网络
curl -s https://openrouter.ai/api/v1/models | head -c 100
# → 如果超时，需要先配代理（见第 6 节），或选用本地 Ollama 方案
```

### 7.2 安装 ZeroClaw（约 10-15 分钟，源码编译）

```bash
# 安装 Rust（如果没有）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 安装 ZeroClaw（ARM64 必须源码编译）
curl -sSL https://get.zeroclaw.dev | bash -s -- --force-source-build

# 验证
~/.cargo/bin/zeroclaw --version
# → zeroclaw 0.6.8
```

### 7.3 配置 ZeroClaw（首次 onboard + autonomy）

```bash
# 1. 初始化
~/.cargo/bin/zeroclaw onboard
# → Provider: openai（兼容 OpenRouter）
# → Base URL: https://openrouter.ai/api/v1
# → API Key: sk-or-v1-xxxxx（会被加密存储）
# → Default Model: deepseek/deepseek-chat

# 2. 修改 autonomy 为 full
nano ~/.zeroclaw/config.toml
```

确保 `[autonomy]` 段为：

```toml
[autonomy]
level = "full"
workspace_only = true
```

```bash
# 3. 验证连通性
~/.cargo/bin/zeroclaw agent -m "Reply exactly: OK"
# → OK
```

### 7.4 安装 Sparkbox Jetson

```bash
# 创建目录（如果是首次）
mkdir -p ~/Documents/projects/clawbox
cd ~/Documents/projects/clawbox

# 方式 A：从 Git 部署
git clone <repo-url> .

# 方式 B：从开发机同步
# 在开发机上运行：
# bash scripts/deploy_to_jetson.sh --apply --host jetson

# 创建 Python 环境
conda create -p ./env python=3.13 -y

# 运行安装脚本
bash install.sh
```

### 7.5 配置 .env

```bash
cp .env.example .env
nano .env
```

**必须修改的项**：

```bash
# 强密码（不要用默认值）
BOOTSTRAP_OWNER_PASSWORD=<你的强密码>
API_TOKEN=<随机生成：python3 -c "import secrets;print(secrets.token_urlsafe(32))">
DEVICE_AGENT_BEARER_TOKEN=<随机生成>
DEVICE_PAIRING_SHARED_SECRET=<随机生成>

# ZeroClaw 路径（指向上一步安装的位置）
ZEROCLAW_BIN=/home/nvidia/.cargo/bin/zeroclaw
ZEROCLAW_CONFIG_DIR=/home/nvidia/.zeroclaw

# 推理配置（选一个方案）
# 方案 A - OpenRouter：
INFERENCE_BASE_URL=https://openrouter.ai/api/v1
INFERENCE_API_KEY=sk-or-v1-xxxxx
INFERENCE_MODEL=deepseek/deepseek-chat
# 方案 B - 本地 Ollama：
# INFERENCE_BASE_URL=http://127.0.0.1:11434/v1
# INFERENCE_API_KEY=
# INFERENCE_MODEL=qwen3.5:9b
```

### 7.6 安装 systemd 服务

```bash
# 安装主服务
sudo cp clawbox.service /etc/systemd/system/
# 修正路径（如果不是默认路径）
sudo sed -i "s|/home/nvidia/Documents/projects/clawbox|$(pwd)|g" /etc/systemd/system/clawbox.service
sudo systemctl daemon-reload
sudo systemctl enable --now clawbox.service

# 检查运行状态
sudo systemctl status clawbox
journalctl -u clawbox -f --no-pager -n 20

# （可选）安装健康检查定时任务
sudo cp clawbox-healthcheck.service /etc/systemd/system/
sudo sed -i "s|/home/nvidia/Documents/projects/clawbox|$(pwd)|g" /etc/systemd/system/clawbox-healthcheck.service
sudo systemctl daemon-reload
```

### 7.7 验证部署

#### 7.7.1 验证 Sparkbox API 可达

```bash
curl -s http://localhost:8080/api/config/status \
  -H "Authorization: Bearer <你的API_TOKEN>" | python3 -m json.tool
# → 应返回设备状态 JSON
```

#### 7.7.2 验证 ZeroClaw 单独运行

```bash
~/.cargo/bin/zeroclaw agent -m "Reply exactly: OK"
# → OK

# 验证 full autonomy（应自动执行，不弹确认）
~/.cargo/bin/zeroclaw agent -m "List files in your workspace using the shell tool"
```

#### 7.7.3 验证 Sparkbox 调用隔离工作区

```bash
# 通过 API 触发一次聊天（这会自动创建用户工作区）
curl -X POST http://localhost:8080/api/device-agent/chat/stream \
  -H "Authorization: Bearer <DEVICE_AGENT_BEARER_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "X-Sparkbox-User-Id: test-user" \
  -d '{"messages": [{"role": "user", "content": "Hello, who are you?"}]}'

# 检查用户工作区是否正确创建
ls -la data/zeroclaw_workspaces/test-user/workspace/
# 应包含: AGENTS.md  IDENTITY.md  WIKI.md  SOUL.md  MEMORY.md
#         TOOLS.md  USER.md  HEARTBEAT.md  user_raw_file/  work/

# 关键验证：确认 ZeroClaw 使用的是用户工作区，而非全局 ~/.zeroclaw/workspace
# 检查全局工作区没有新增内容
ls ~/.zeroclaw/workspace/ 2>/dev/null || echo "全局 workspace 不存在（正常）"
```

#### 7.7.4 验证 ZeroClaw 工作区隔离

```bash
# 手动模拟 Sparkbox 的调用方式：
ZEROCLAW_WORKSPACE=$(pwd)/data/zeroclaw_workspaces/test-user \
  ~/.cargo/bin/zeroclaw --config-dir ~/.zeroclaw agent \
  -m "Read WIKI.md and tell me what it says"

# ZeroClaw 应该读取 data/zeroclaw_workspaces/test-user/workspace/WIKI.md
# 而不是 ~/.zeroclaw/workspace/WIKI.md
```

#### 7.7.5 验证 Wiki 和文件整理

```bash
# 先上传一个测试文件
curl -X POST http://localhost:8080/api/device-agent/files/upload \
  -H "Authorization: Bearer <DEVICE_AGENT_BEARER_TOKEN>" \
  -H "X-Sparkbox-User-Id: test-user" \
  -F "file=@test.md" \
  -F "space_type=private"

# 触发 Wiki 整理
curl -X POST http://localhost:8080/api/device-agent/wiki/organize \
  -H "Authorization: Bearer <DEVICE_AGENT_BEARER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "space_type": "private"}'

# 检查 WIKI.md 是否更新
cat data/zeroclaw_workspaces/test-user/workspace/WIKI.md
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

### 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| `All providers/models failed` | 网络不通或代理配置错误 | `curl https://openrouter.ai/api/v1/models` 检查连通性 |
| `Unknown config key: api_key` | ZeroClaw 版本差异的 warning | 可忽略，不影响运行 |
| `file_write` 弹出 `[Y/N]` 确认 | autonomy level 不是 `full` | 检查 config.toml `[autonomy] level = "full"` |
| 工具执行超时 | `shell_timeout_secs` 太短 | 增大 `[autonomy] shell_timeout_secs = 120` |
| 加密 API Key 解密失败 | config.toml 被移动到其他路径 | 在原路径运行 `zeroclaw onboard --reinit` 重新设置 |
| Wiki rebuild 返回 400 | OpenRouter 模型名格式错误 | `INFERENCE_MODEL` 必须含 provider 前缀，如 `deepseek/deepseek-chat` |
| 记忆相关错误 | brain.db 损坏 | 删除 `data/zeroclaw_workspaces/<user_id>/memory/brain.db`，ZeroClaw 会自动重建 |
| 聊天回复内容是 ZeroClaw 默认文本 | `ZEROCLAW_WORKSPACE` 没有传递到子进程 | 见下方「工作区路径排查」 |
| 聊天回复不含用户文档内容 | 上下文注入失败（指针文件损坏或 raw 文件不存在） | 检查 `user_raw_file/*.ptr.json` 中的 `raw_path` 是否指向有效文件 |

### 工作区路径排查

如果怀疑 ZeroClaw 没有使用正确的用户工作区：

```bash
# 1. 确认 ZEROCLAW_BIN 不是 .cmd 文件（生产环境不应该是 .cmd）
grep ZEROCLAW_BIN .env
# → 应该是 /home/nvidia/.cargo/bin/zeroclaw，不是 xxx.cmd

# 2. 手动模拟 Sparkbox 调用方式
ZEROCLAW_WORKSPACE=$(pwd)/data/zeroclaw_workspaces/test-user \
  /home/nvidia/.cargo/bin/zeroclaw --config-dir /home/nvidia/.zeroclaw \
  agent -m "What files are in your workspace? Use the shell tool to list them."

# 3. 对比：不设 ZEROCLAW_WORKSPACE（应使用默认路径）
/home/nvidia/.cargo/bin/zeroclaw agent -m "What files are in your workspace? Use the shell tool to list them."
# → 如果两次列出的文件不同，说明 ZEROCLAW_WORKSPACE 生效了

# 4. 查看 Sparkbox 日志
journalctl -u clawbox -f --no-pager | grep -i "zeroclaw\|workspace"
```

### 代码更新后的部署

```bash
# 从开发机同步代码
# （在开发机上执行：）
bash scripts/deploy_to_jetson.sh --apply

# 在 Jetson 上：
cd /home/nvidia/Documents/projects/clawbox
pip install -r requirements.txt    # 如果依赖变了
sudo systemctl restart clawbox
journalctl -u clawbox -f --no-pager -n 20
```

## 10. Sparkbox 如何调用 ZeroClaw（内部机制）

### 调用链路

```
手机 App
  │ HTTPS (Tailscale)
  ▼
Sparkbox Cloud (中继)
  │ HTTPS
  ▼
Sparkbox Jetson (FastAPI)
  │
  ├─ /api/device-agent/chat/stream          ← 聊天
  │   └─ run_zeroclaw_stream_for_user()
  │       1. ensure_workspace(user_id)      ← 自动创建/迁移用户工作区
  │       2. _build_workspace_context_prompt()  ← 注入 WIKI.md + raw 文件内容到 prompt
  │       3. env["ZEROCLAW_WORKSPACE"] = data/zeroclaw_workspaces/{user_id}
  │       4. exec: zeroclaw --config-dir ~/.zeroclaw agent -m "<enriched_prompt>"
  │       5. 解析 ZeroClaw JSON 输出 → 提取 message 字段 → SSE 流式返回
  │
  ├─ /api/device-agent/wiki/organize        ← 文件整理
  │   └─ run_zeroclaw_for_user()            ← 同上，非流式
  │
  └─ /api/device-agent/wiki/rebuild         ← Wiki 结构化重建
      └─ 直接调用 OpenAI API（不走 ZeroClaw）← 需要精确控制 JSON 输出格式
```

### 关键设计：双层隔离

```
~/.zeroclaw/config.toml                     ← 全局共享（provider, API Key, autonomy）
  ↑ --config-dir 指向此处
  │
zeroclaw --config-dir ~/.zeroclaw agent -m "..."
  │
  ↓ ZEROCLAW_WORKSPACE 指向用户目录
data/zeroclaw_workspaces/{user_id}/         ← 每用户独立
  ├── workspace/                            ← ZeroClaw 的文件操作范围
  │   ├── AGENTS.md, WIKI.md, ...          ← Sparkbox 创建的核心文件
  │   └── user_raw_file/*.ptr.json         ← 指向 raw/ 实际文件的指针
  ├── memory/brain.db                       ← ZeroClaw 记忆（每用户独立）
  ├── sessions/                             ← 会话历史（每用户独立）
  └── state/                                ← 运行时状态（每用户独立）
```

- `--config-dir`：告诉 ZeroClaw 用哪个配置文件（provider/key/autonomy），所有用户共享一份
- `ZEROCLAW_WORKSPACE`：告诉 ZeroClaw 工作区在哪里，每个用户不同
- `workspace_only = true`：ZeroClaw 只能操作 workspace/ 子目录内的文件，不能越界

### 上下文注入

聊天时，Sparkbox 在把用户消息交给 ZeroClaw 之前，会自动读取用户工作区的知识并注入到 prompt 中：

```
[WORKSPACE_WIKI]
# 用户的 WIKI.md 内容（知识索引）
[/WORKSPACE_WIKI]

[WORKSPACE_FILES]
### notes.md
# 通过指针文件解析的原始文件内容（仅文本文件，单文件最大 3000 字符）
[/WORKSPACE_FILES]

[USER_MESSAGE]
用户的实际消息
[/USER_MESSAGE]
```

这样 ZeroClaw 在回复时能参考用户上传的文档内容，而不仅仅依赖自己的系统 prompt。
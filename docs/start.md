# Sparkbox 三端本地联调启动指南

本文目标：在一台本地开发机上同时跑起 cloud + jetson + mobile（Android 模拟器），实现三端协同开发。

## 1. 本地联调拓扑

推荐端口：

- cloud: `8010`
- jetson(本地模拟服务): `8080`
- mobile: Android Studio 模拟器

关键地址关系：

- cloud 访问 jetson：`http://127.0.0.1:8080`
- jetson 回报 cloud：`http://127.0.0.1:8010`
- Android 模拟器访问宿主机 cloud：`http://10.0.2.2:8010`

说明：Android 模拟器内的 `127.0.0.1` 指向模拟器自身，不是你电脑。访问宿主机必须用 `10.0.2.2`。

---

## 2. 启动 cloud（sparkbox_cloud）

### 2.1 进入目录并准备环境

在 PowerShell：

```powershell
cd d:\gitRepo\sparkbox_cloud

# 如需新建环境
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

如果你希望直接复用仓库里的 `env`，也可以改用该环境的 python 启动。

### 2.2 配置环境变量

1. 把 `.env.example` 复制为 `.env`
2. 至少确认以下值（本地联调用推荐值）

```env
DATABASE_URL=sqlite:///./sparkbox_cloud.db

BOOTSTRAP_DEVICE_ID=sbx-demo-001
BOOTSTRAP_SHORT_CLAIM_CODE=482917

DEVICE_AGENT_BEARER_TOKEN=device-agent-dev-token
DEVICE_PAIRING_SHARED_SECRET=sparkbox-pairing-dev-secret

CLOUD_CORS_ALLOWED_ORIGINS=http://127.0.0.1:4173,http://localhost:4173
CLOUD_CORS_ALLOWED_ORIGIN_REGEX=http://(127\.0\.0\.1|localhost):\d+
```

说明：cloud 已支持自动加载 `.env`。修改 `.env` 后请重启 cloud 服务。

### 2.3 启动 cloud

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

健康检查：

```powershell
curl http://127.0.0.1:8010/health
```

期望返回：`{"ok": true}`

---

## 3. 启动 jetson 服务（本地模拟，sparkbox_jetson）

### 3.1 进入目录并准备环境

```powershell
cd d:\gitRepo\sparkbox_jetson

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

注意：该服务包含 Wi-Fi/BLE 与 `nmcli` 相关逻辑。在 Windows 上没有 `nmcli` 时会自动降级为 dry-run，不影响大部分联调。

补充：`requirements.txt` 已适配 Windows，`bluezero` 仅在 Linux 安装，避免 Windows 下 PyGObject 安装失败。

### 3.2 配置环境变量（重点）

建议基于 `.env.sparkbox-local.example` 新建 `.env`，并确保以下字段一致：

```env
# jetson -> cloud
CLOUD_API_BASE=http://127.0.0.1:8010

# cloud -> jetson（云端缓存并在 reconnect/diagnostics 场景使用）
DEVICE_CONTROL_BASE_URL=http://127.0.0.1:8080

# 与 cloud 完全一致
DEVICE_AGENT_BEARER_TOKEN=device-agent-dev-token
DEVICE_PAIRING_SHARED_SECRET=sparkbox-pairing-dev-secret

# 与 cloud bootstrap 设备一致
DEVICE_PUBLIC_ID=sbx-demo-001
DEVICE_SHORT_CLAIM_CODE=482917

# 本地机建议显式指定（可选但推荐）
DEVICE_NETWORK_CONTROL_MODE=auto

# 可选：开发环境使用 WSL 中 zeroclaw（DeepSeek 路由时需要）
# ZEROCLAW_BIN=D:/gitRepo/sparkbox_jetson/scripts/zeroclaw-wsl.cmd
```

如果你要在 Windows 上走 DeepSeek（不依赖本地 Ollama），建议启用 `ZEROCLAW_BIN` 指向 WSL 包装器，并确保 WSL 内 `zeroclaw status` 正常。

### 3.3 启动 jetson 服务

```powershell
uvicorn main:app --host 127.0.0.1 --port 8080 --reload
```

健康检查（setup 诊断接口）：

```powershell
curl http://127.0.0.1:8080/api/setup/diagnostics
```

---

## 4. 配置 mobile 对接本地 cloud（sparkbox_mobile）

### 4.1 修改 cloud API 基地址

移动端默认是线上地址 `https://morgen52.site/familyserver`。本地联调要改为本机 cloud：

1. 修改 `app.json` 中 `expo.extra.cloudApiBase`
2. 为避免兜底默认值误导，建议同步修改 `src/cloudApiBase.ts` 里的 `DEFAULT_CLOUD_API_BASE`

Android 模拟器推荐值：

```text
http://10.0.2.2:8010
```

如果用真机调试，把上面地址改成你电脑局域网 IP（例如 `http://192.168.31.10:8010`）。

### 4.2 启动 mobile

```powershell
cd d:\gitRepo\sparkbox_mobile
npm install
npx expo run:android
```

### 4.3 Android 模拟器绑定旁路（仅开发环境）

适用场景：模拟器无法自动切到 `Sparkbox-Setup`，或本机不存在真实热点，导致卡在 Connect 步骤。

该方案只用于本地开发调试，不会默认启用。生产环境不应开启。

在启动 mobile 的同一个 PowerShell 终端中设置：

```powershell
$env:EXPO_PUBLIC_DEV_BYPASS_HOTSPOT_CONNECT="true"
$env:EXPO_PUBLIC_LOCAL_SETUP_BASE_URL="http://10.0.2.2:8080"
```

然后重新启动 APP（如果 Metro 已经在跑，先停掉再启动）：

```powershell
npx expo run:android
```

说明：

- `EXPO_PUBLIC_DEV_BYPASS_HOTSPOT_CONNECT=true`：在开发环境下，自动切网失败时直接进入下一步，不再强制停留在 Connect。
- `EXPO_PUBLIC_LOCAL_SETUP_BASE_URL=http://10.0.2.2:8080`：让模拟器直接访问本机 jetson 本地服务，替代热点地址 `192.168.4.1:8080`。

关闭旁路：重开终端或清空上述环境变量后再启动 APP。

---

## 5. 三端成功对接的最小配置清单

以下 4 组是必须对齐的，任何一项不一致都会导致配对或设备控制失败。

### A. 设备身份（cloud 与 jetson）

- `BOOTSTRAP_DEVICE_ID` == `DEVICE_PUBLIC_ID`
- `BOOTSTRAP_SHORT_CLAIM_CODE` == `DEVICE_SHORT_CLAIM_CODE`

### B. 设备代理鉴权（cloud 与 jetson）

- `DEVICE_AGENT_BEARER_TOKEN` 两端一致

用途：cloud 访问 jetson 的 `/api/device-agent/*` 以及相关受保护操作。

### C. 配对安全密钥（cloud 与 jetson）

- `DEVICE_PAIRING_SHARED_SECRET` 两端一致

用途：pairing complete 时校验 `device_proof`。

### D. 双向地址（jetson 与 mobile）

- jetson 的 `CLOUD_API_BASE` 指向 cloud（本机：`http://127.0.0.1:8010`）
- jetson 的 `DEVICE_CONTROL_BASE_URL` 指向 jetson 自己（本机：`http://127.0.0.1:8080`）
- mobile 的 cloud base 指向 cloud（模拟器：`http://10.0.2.2:8010`）

### E. 模型提供方（jetson）

- `~/.zeroclaw/config.toml` 中的 `default_provider` 决定设备聊天走向
- `default_provider=ollama`：走本地 Ollama
- `default_provider=deepseek`（或其他非 `ollama`）：走 `zeroclaw agent`

---

## 6. 联调验证顺序（建议）

1. 先起 cloud，确认 `/health` 正常。
2. 再起 jetson，确认 `/api/setup/diagnostics` 可访问。
3. 启动 mobile，并确认登录/注册请求命中本地 `8010`。
4. 在 cloud 侧查看设备列表状态是否变化（heartbeat 后在线状态更新）。
5. 验证聊天、文件、任务等路径是否贯通（mobile -> cloud -> jetson）。

建议额外做一条最小聊天验收：发送 “Reply exactly: PING”，期望返回 “PONG”。

---

## 7. 常见问题

### 7.1 模拟器请求不到 cloud

检查是否仍在使用 `127.0.0.1:8010`。模拟器应改为 `10.0.2.2:8010`。

### 7.2 设备始终离线

重点检查：

- jetson `.env` 里的 `CLOUD_API_BASE`
- cloud/jetson 两端 `DEVICE_AGENT_BEARER_TOKEN`
- cloud/jetson 两端 `DEVICE_PAIRING_SHARED_SECRET`

### 7.3 Windows 下 Wi-Fi/AP 相关行为异常

这是预期：本地 Windows 不具备 Jetson 的 `nmcli` 与真实 AP 切换能力。可先完成 API 协同开发；真实配网链路建议在 Linux/Jetson 实机验收。

### 7.4 Connect 步骤一直提示手动切网

如果提示类似 “This phone cannot switch Wi-Fi automatically right now...”，通常表示当前设备（常见于模拟器）没有可用的原生自动切网能力。

处理方式：

- 真机联调：按提示手动加入 `Sparkbox-Setup`。
- 模拟器联调：使用 4.3 的开发旁路开关继续后续流程。

### 7.5 pairing complete 返回 401

重点检查 cloud 与 jetson 的 `DEVICE_PAIRING_SHARED_SECRET` 是否完全一致。

重点检查 cloud 是否读取到了正确 `.env`，并在修改后完成重启。

### 7.6 device-agent/chat 返回 `Provider deepseek execution failed`

先确认 jetson `.env` 中 `ZEROCLAW_BIN` 指向可用的 WSL 包装器，且在命令行可运行：

```powershell
cd d:\gitRepo\sparkbox_jetson
.\scripts\zeroclaw-wsl.cmd status
```

若 `status` 正常，再检查 WSL 内 `~/.zeroclaw/config.toml` 是否已正确设置 `default_provider=deepseek`、`default_model=deepseek-chat`。

### 7.7 Windows 下使用 `uvicorn --reload` 的注意点

项目已在代码层做了子进程调用兼容回退，避免 Windows 事件循环导致的 `NotImplementedError`。若你仍遇到类似问题，先确认已重启 jetson 进程并使用最新代码。

---

## 8. 二维码/链接码手动输入格式

手机端支持多种格式，核心都是 `device_id + claim_code`。

可直接用于手动输入测试：

- URL 形式：`sparkbox://claim?device_id=sbx-demo-001&claim_code=482917`
- 键值形式：`device_id=sbx-demo-001,claim_code=482917`
- JSON 形式：`{"device_id":"sbx-demo-001","short_claim_code":"482917"}`

---

## 9. 大模型请求链路说明（当前实现）

1. mobile 把聊天请求发到 cloud。
2. cloud 把设备聊天请求转发到 jetson 的 `device-agent` 接口。
3. jetson 根据 provider 路由：
	- `ollama`：直连本地 Ollama API。
	- 非 `ollama`（如 `deepseek`）：调用 `zeroclaw agent`。

这意味着：开发环境可以不部署本地 Ollama，改用 DeepSeek API 完成联调。
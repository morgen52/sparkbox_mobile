# Sparkbox 全项目机理与本地调试指南

本文面向开发与联调，说明 Sparkbox 三端系统如何协同工作，并给出在 Windows 电脑上本地调试 Cloud 与 Mobile 的可执行步骤。

当前前提：
- Jetson 端已经部署完成（ZeroClaw + Ollama + Clawbox）
- 你通过 Tailscale 可访问 Jetson 与云侧资源

---

## 1. 项目目标与整体分层

Sparkbox 由三部分组成：

- Mobile（安卓 App）
	- 用户入口：登录、配对、聊天、文件、任务、设置
	- 负责首次配网（连接 Sparkbox-Setup 热点）与日常使用
- Cloud（云控制面）
	- 账户、家庭、设备绑定、配对校验、命令中转、活动日志
	- 对手机提供统一 API，并与 Jetson 进行设备级通信
- Jetson（设备侧运行时）
	- 本地推理：Ollama + qwen 模型
	- 设备能力：ZeroClaw、网络控制、心跳上报、命令执行
	- 本地 setup 页：提供 192.168.4.1:8080/setup 给手机进行配网

一句话理解：
Cloud 是控制平面，Jetson 是执行平面，Mobile 是交互平面。

---

## 2. 三端运行机理（关键链路）

## 2.1 配对与首次上手链路

1. 用户在 Mobile 登录 Cloud 账号。
2. 用户扫码设备二维码或输入 claim code，Mobile 调用 Cloud 配对起点。
3. Cloud 返回短期 pairing_token。
4. 用户在手机端连接 Sparkbox-Setup 热点。
5. Mobile 将家中 Wi-Fi 与 pairing_token 发送到 Jetson 本地 setup API。
6. Jetson 尝试连网并向 Cloud 完成绑定校验（含 shared secret 证明）。
7. 成功后设备状态进入可用（例如 bound_online），Mobile 可在家庭设备列表看到在线状态。

你仓库中的对应关键实现：
- Mobile 本地 setup API 基地址：src/localSetupApi.ts
- Mobile 嵌入 setup 页地址：src/hotspotSetup.ts
- Cloud 配对路由：app/routes/pairing.py
- Jetson setup 路由：routers/setup_router.py

## 2.2 日常聊天链路

1. Mobile 发送聊天消息到 Cloud。
2. Cloud 按设备在线状态与绑定关系进行中转。
3. Jetson 拉取或接收命令后调用本地推理服务（Ollama/ZeroClaw）。
4. 结果由 Jetson 回传 Cloud，再回到 Mobile。

对应能力点：
- Cloud 聊天与中转：app/routes/chat.py
- Cloud 设备命令队列：app/device_commands.py
- Jetson 设备命令 worker：services/device_command_worker.py
- Jetson 推理协调：services/inference_coordinator.py

## 2.3 心跳与设备状态链路

1. Jetson 周期性向 Cloud 上报 heartbeat。
2. Cloud 更新设备在线、可控、健康摘要等状态。
3. Mobile 查询设备列表与诊断数据，展示在线/离线与注意事项。

对应能力点：
- Jetson 心跳服务：services/device_heartbeat.py
- Cloud 设备路由：app/routes/devices.py

## 2.4 认证与安全模型

- 用户侧认证
	- Mobile 使用 Cloud 登录后得到 Bearer token
	- Cloud 通过会话存储与 token 指纹校验
- 设备侧认证
	- Jetson 调用 Cloud 设备代理接口时使用 device_agent_bearer_token
- 配对安全
	- Cloud 与 Jetson 共享 device_pairing_shared_secret
	- 用于配对完成时的证明与防伪绑定

要点：Cloud 与 Jetson 的 token/secret 必须严格一致，否则会出现“能登录但设备不可控/不可绑定”的假在线问题。

---

## 3. 核心代码结构速览

## 3.1 Mobile（sparkbox_mobile）

- 入口
	- App.tsx
- 核心 API 与流程
	- src/householdApi.ts（Cloud API 交互）
	- src/authFlow.ts（登录/注册/邀请）
	- src/localSetupApi.ts（直连 Jetson 本地 setup）
	- src/hotspotSetup.ts（setup 页 URL 与参数拼装）
- 主要页面容器
	- src/components/ChatsPane.tsx
	- src/components/LibraryPane.tsx
	- src/components/Settings*Pane.tsx

## 3.2 Cloud（sparkbox_cloud）

- 入口
	- app/main.py
- 核心模块
	- app/routes/auth.py
	- app/routes/pairing.py
	- app/routes/devices.py
	- app/routes/chat.py
	- app/routes/device_agent.py
	- app/device_commands.py
- 配置
	- app/config.py
	- .env.example

## 3.3 Jetson（sparkbox_jetson）

- 入口
	- main.py
- 核心模块
	- core/config.py
	- routers/setup_router.py
	- routers/device_agent_router.py
	- services/device_heartbeat.py
	- services/device_command_worker.py

---

## 4. Windows 本地调试 Cloud（Conda 主路径）

以下步骤在 PowerShell 执行。

## 4.1 准备 Python 环境

进入云端目录：

```powershell
cd d:\gitRepo\sparkbox_cloud
```

创建并激活 Conda 环境（按仓库 README）：

```powershell
conda create -y --prefix .\env python=3.13 pip
conda activate .\env
```

安装依赖：

```powershell
pip install -r requirements.txt
```

## 4.2 配置环境变量

复制模板：

```powershell
Copy-Item .env.example .env
```

至少检查以下配置是否与你 Jetson 一致：

- DEVICE_AGENT_BEARER_TOKEN
- DEVICE_PAIRING_SHARED_SECRET

并根据你前端来源补充 CORS：

- CLOUD_CORS_ALLOWED_ORIGINS
- CLOUD_CORS_ALLOWED_ORIGIN_REGEX

## 4.3 启动与验证

启动 Cloud：

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8010
```

健康检查（新开 PowerShell）：

```powershell
Invoke-RestMethod http://127.0.0.1:8010/health
```

预期返回：

```text
ok : True
```

## 4.4 跑测试

在 sparkbox_cloud 目录执行：

```powershell
python -m pytest -q
```

如需聚焦链路：

```powershell
python -m pytest -q tests/test_pairing.py tests/test_chat.py tests/test_devices.py
```

---

## 5. Windows 本地调试 Mobile（Android 模拟器主路径）

## 5.1 基础环境

需要准备：

- Node.js（建议 LTS）
- Android Studio（含 Android SDK 与至少一个模拟器）
- 已安装并可用的 npm

进入目录并安装依赖：

```powershell
cd d:\gitRepo\sparkbox_mobile
npm install
npm run typecheck
```

## 5.2 启动开发服务

推荐 dev client 模式：

```powershell
npm run dev
```

也可直接尝试拉起安卓：

```powershell
npm run android
```

若模拟器已启动，Expo 会将应用推送到模拟器。

## 5.3 Cloud 地址切换（联调重点）

当前移动端 API 基地址在代码中是生产地址：

- src/householdApi.ts
	- CLOUD_API_BASE = https://morgen52.site/familyserver

如果你要调试本地 Cloud（127.0.0.1:8010），建议改为你 Windows 主机可被模拟器访问的地址。

常见做法：

- Android 模拟器使用 10.0.2.2 指向主机本机
- 即把基地址临时改为 http://10.0.2.2:8010

注意：
- app.json 中也有 extra.cloudApiBase 字段
- 以当前代码为准，实际请求入口在 src/householdApi.ts 的常量
- 建议后续把这个常量改成可配置读取，避免每次手改

## 5.4 本地配网页（Jetson）调试点

移动端内置的本地 setup 地址为：

- src/localSetupApi.ts -> http://192.168.4.1:8080
- src/hotspotSetup.ts -> http://192.168.4.1:8080/setup

这部分不是走 Cloud，而是手机连到 Sparkbox-Setup 热点后直连 Jetson。

---

## 6. 你当前场景下的推荐联调路径

你的前提是 Jetson 已部署并可通过 Tailscale 访问，因此推荐两条联调线。

## 6.1 线 A：全量走线上 Cloud（最接近真实验收）

1. Mobile 保持生产 API 地址不改。
2. 在模拟器登录账号。
3. 查看设备列表与在线状态。
4. 发起聊天，确认有稳定回复。
5. 验证设置页中的诊断/重启等操作。

适合：回归验收与产品体验验证。

## 6.2 线 B：Mobile + 本地 Cloud + 远程 Jetson（开发联调）

1. 本机启动 Cloud（127.0.0.1:8010）。
2. 修改 Mobile API 基地址为 http://10.0.2.2:8010。
3. 保证本地 Cloud 的 .env 中：
	 - DEVICE_AGENT_BEARER_TOKEN 与 Jetson 一致
	 - DEVICE_PAIRING_SHARED_SECRET 与 Jetson 一致
4. 让 Jetson 可访问你的本地 Cloud（如果不在同一可达网络，需要额外反向代理或隧道）。

说明：
该线最容易踩坑的是“Jetson 到你本地 8010 的回连不可达”。如果 Jetson 无法回连，本地 Cloud 只能完成用户侧流程，设备命令链路会断。

---

## 7. 最小可用验证清单

完成以下 6 步可证明系统基本闭环正常：

1. Cloud 健康检查返回 ok=true。
2. Mobile 能登录并拿到家庭信息。
3. 设备列表能看到目标设备（至少 claimed=true）。
4. 设备在线状态为在线或最近有心跳。
5. 发送一条 chat 消息并收到模型回复。
6. 设置页读取诊断信息成功。

---

## 8. 常见故障与定位顺序

## 8.1 登录正常但设备不可控

优先检查：
- Cloud 与 Jetson 的 DEVICE_AGENT_BEARER_TOKEN 是否一致
- Jetson 到 Cloud 的 API 连通性是否正常

## 8.2 配对卡住或完成失败

优先检查：
- DEVICE_PAIRING_SHARED_SECRET 是否一致
- 手机是否真的连在 Sparkbox-Setup 热点
- Jetson setup API 是否可达（192.168.4.1:8080）

## 8.3 模拟器无法访问本地 Cloud

优先检查：
- 是否使用了 10.0.2.2 而不是 127.0.0.1
- Windows 防火墙是否允许 8010
- Uvicorn 是否监听在 127.0.0.1:8010（或按需改为 0.0.0.0）

## 8.4 Cloud 正常但 chat 无回复

优先检查：
- Jetson 侧 Ollama/ZeroClaw 运行状态
- Jetson 命令 worker 是否在运行
- 心跳是否持续上报

---

## 9. 建议的后续工程化改进

1. 把 Mobile 的 CLOUD_API_BASE 从硬编码改为环境可配置。
2. 增加一键切换 dev/staging/prod 的配置机制。
3. 在 Cloud 增加设备链路自检接口，便于快速定位 token/secret/回连问题。
4. 为联调提供脚本化 smoke test（登录、设备列表、chat 一次通过）。

以上内容可作为新人 onboarding 文档，也可作为你当前 Windows 开发机的日常联调手册。

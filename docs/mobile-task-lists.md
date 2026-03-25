# Sparkbox 项目梳理清单（Cloud API / 目标功能 / Mobile 结构）

本文基于当前工作区源码与文档整理，覆盖三端：
- Cloud: [sparkbox_cloud/app](../sparkbox_cloud/app)
- Jetson: [sparkbox_jetson](../sparkbox_jetson)
- Mobile: [sparkbox_mobile](.)

## 1. Cloud 后端提供的所有 API

来源：
- 应用入口与路由挂载: [sparkbox_cloud/app/main.py](../sparkbox_cloud/app/main.py)
- 具体路由目录: [sparkbox_cloud/app/routes](../sparkbox_cloud/app/routes)

### 1.1 Health
- GET /health

### 1.2 Auth 与家庭成员管理（/api/auth）
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- DELETE /api/auth/session
- POST /api/auth/invitations
- GET /api/auth/invitations/preview/{invite_code}
- DELETE /api/auth/invitations/{invitation_id}
- POST /api/auth/join

### 1.3 Household 汇总（/api/household）
- GET /api/household
- DELETE /api/household/members/{member_id}
- PATCH /api/household/members/{member_id}/role

### 1.4 Device 生命周期与运维（/api/devices）
- GET /api/devices
- POST /api/devices/heartbeat
- GET /api/devices/{device_id}/diagnostics
- POST /api/devices/{device_id}/reset
- POST /api/devices/{device_id}/reprovision
- POST /api/devices/{device_id}/reconnect

### 1.5 Device 高级配置透传（/api/devices/{device_id}/config）
- GET /api/devices/{device_id}/config/status
- GET /api/devices/{device_id}/config/providers
- GET /api/devices/{device_id}/config/models/ollama
- GET /api/devices/{device_id}/config/zeroclaw
- PATCH /api/devices/{device_id}/config/zeroclaw
- POST /api/devices/{device_id}/config/zeroclaw/onboard
- GET /api/devices/{device_id}/config/inference
- POST /api/devices/{device_id}/config/services/{service_name}

### 1.6 Pairing 配对（/api/pairing）
- POST /api/pairing/start
- POST /api/pairing/complete

### 1.7 Chat（/api/chat）
- GET /api/chat/household
- POST /api/chat/household
- DELETE /api/chat/household
- GET /api/chat/sessions
- POST /api/chat/sessions
- GET /api/chat/sessions/{session_id}
- PATCH /api/chat/sessions/{session_id}
- DELETE /api/chat/sessions/{session_id}
- DELETE /api/chat/sessions/{session_id}/messages
- POST /api/chat/sessions/{session_id}/messages
- POST /api/chat/sessions/{session_id}/messages/stream

### 1.8 Spaces 与空间协作（/api/spaces）
- GET /api/spaces
- POST /api/spaces
- GET /api/spaces/{space_id}
- PATCH /api/spaces/{space_id}/members
- POST /api/spaces/{space_id}/side-channel
- POST /api/spaces/{space_id}/threads/{thread_id}/open
- POST /api/spaces/{space_id}/relay
- POST /api/spaces/{space_id}/family-apps/{slug}/enable
- DELETE /api/spaces/{space_id}/family-apps/{slug}

### 1.9 Space Library（/api/spaces/{space_id}）
- GET /api/spaces/{space_id}/library
- GET /api/spaces/{space_id}/memories
- POST /api/spaces/{space_id}/memories
- PATCH /api/spaces/{space_id}/memories/{memory_id}
- POST /api/spaces/{space_id}/memories/{memory_id}/pin
- DELETE /api/spaces/{space_id}/memories/{memory_id}
- GET /api/spaces/{space_id}/summaries
- POST /api/spaces/{space_id}/summaries
- POST /api/spaces/{space_id}/summaries/from-session
- DELETE /api/spaces/{space_id}/summaries/{summary_id}

### 1.10 Family Apps（/api/family-apps）
- GET /api/family-apps/catalog
- GET /api/family-apps/installed
- POST /api/family-apps/install
- DELETE /api/family-apps/{slug}

### 1.11 Files（/api/files）
- GET /api/files
- POST /api/files/mkdir
- POST /api/files/rename
- DELETE /api/files
- POST /api/files/upload
- GET /api/files/download

### 1.12 Tasks（/api/tasks）
- GET /api/tasks
- POST /api/tasks
- PATCH /api/tasks/{task_id}
- DELETE /api/tasks/{task_id}
- POST /api/tasks/{task_id}/trigger
- GET /api/tasks/{task_id}/history

### 1.13 Device Agent 专用（设备侧调用，/api/device-agent）
- POST /api/device-agent/commands/claim
- POST /api/device-agent/commands/{command_id}/result

## 2. 期望实现的所有功能

说明：本节是三端合并后的目标能力图谱，综合自产品设计与仓库 TODO，包括“已落地能力”与“明确规划能力”。

### 2.1 账户、家庭、角色
- 用户注册/登录/会话管理
- Household 创建与成员加入
- 邀请码机制（预览、发放、撤销、过期）
- 多 owner 家庭模型
- owner/member 权限边界（含最后一个 owner 保护）

### 2.2 设备配对与首次开箱
- 设备二维码声明信息（device_id + short claim code）
- 云端签发短时单次 pairing token
- 手机引导连接 Sparkbox-Setup 热点
- 本地 setup API 完成 Wi-Fi 参数提交
- 设备上云完成 binding，进入 bound_online
- 失败恢复：密码错误、弱网、token 过期、中断重试

### 2.3 设备联网与远程可达
- 设备心跳上报与在线 TTL 判定
- 断线后 reconnect/reprovision 流程
- 远程路径稳定性（Tailscale/弱网/移动网络）
- setup 模式与正常模式的自动切换

### 2.4 聊天与空间化协作
- 家庭公共聊天与私聊会话
- 会话创建、编辑、删除、清空消息
- SSE 流式回复
- Space 抽象：private/shared
- Space thread 打开、side-channel、relay 转达
- 空间级上下文沉淀（记忆、摘要）

### 2.5 家庭应用（Family Apps）
- 应用目录与安装/卸载
- 在空间内启用/停用 app
- 风险级别与 owner 确认流程
- 基于模板的线程/入口卡片能力

### 2.6 文件与任务
- 家庭/私有空间文件浏览
- 上传、下载、重命名、删除、建目录
- 定时任务增删改查
- 手动触发任务
- 任务执行历史查询

### 2.7 设备运维与配置
- 设备诊断与缓存诊断兜底
- 设备 reset 与进入 setup 模式
- Zeroclaw 配置读取/修改
- Provider 与 Ollama 模型查询
- 推理状态查询
- 设备服务控制（start/stop/restart 类）

### 2.8 安全基线
- 云端账户认证
- 设备侧凭证（heartbeat token）
- 配对 proof 校验与单次消费
- owner-only 高风险操作限制
- 审计活动日志（邀请、设备操作、任务动作等）

### 2.9 可观测性与可靠性
- online/offline、健康摘要、attention reason
- 远程查看关键状态（network/self-heal/diagnostics）
- 服务自愈、任务后台执行、长任务容错
- 配置与关键数据备份/回滚策略

### 2.10 产品体验目标（移动端优先）
- 一个 App 覆盖 setup + 日常使用
- 新手可完成“开箱即用”全流程
- owner 可远程完成运维与成员管理
- member 可稳定使用聊天、文件、任务等家庭功能

## 3. 当前 Mobile 端的详细结构

核心定位：一个统一的 React Native 客户端，覆盖认证、配对、配网、聊天、资料库、设置与家庭管理。

主要入口与说明：
- 应用入口: [sparkbox_mobile/App.tsx](App.tsx)
- 研发指南: [sparkbox_mobile/docs/development-guide.md](docs/development-guide.md)
- API 适配层: [sparkbox_mobile/src/householdApi.ts](src/householdApi.ts)

### 3.1 顶层工程结构
- 应用与配置
	- [sparkbox_mobile/App.tsx](App.tsx)
	- [sparkbox_mobile/app.json](app.json)
	- [sparkbox_mobile/package.json](package.json)
	- [sparkbox_mobile/tsconfig.json](tsconfig.json)
- 原生 Android 工程
	- [sparkbox_mobile/android](android)
- 文档与脚本
	- [sparkbox_mobile/docs](docs)
	- [sparkbox_mobile/scripts](scripts)
- 业务源码
	- [sparkbox_mobile/src](src)

### 3.2 App.tsx 的职责（当前是编排中枢）
- 全局状态编排：session、setup flow、shell tab、active space
- 生命周期与副作用：初始化、数据拉取、页面切换重置
- 业务流程编排：
	- Auth 流程
	- 首次配对与热点引导
	- 空间切换后的 chat/library/tasks 联动
	- owner 操作（诊断、重置、重配、服务控制）

### 3.3 src 核心业务层
- 认证与配置
	- [sparkbox_mobile/src/authFlow.ts](src/authFlow.ts)
	- [sparkbox_mobile/src/cloudApiBase.ts](src/cloudApiBase.ts)
- Onboarding 与本地 setup
	- [sparkbox_mobile/src/hotspotOnboarding.ts](src/hotspotOnboarding.ts)
	- [sparkbox_mobile/src/hotspotSetup.ts](src/hotspotSetup.ts)
	- [sparkbox_mobile/src/localSetupApi.ts](src/localSetupApi.ts)
	- [sparkbox_mobile/src/wifiOnboarding.ts](src/wifiOnboarding.ts)
- Cloud API 访问与类型层
	- [sparkbox_mobile/src/householdApi.ts](src/householdApi.ts)
- 状态与权限规则
	- [sparkbox_mobile/src/householdState.ts](src/householdState.ts)
	- [sparkbox_mobile/src/spaceShell.ts](src/spaceShell.ts)
	- [sparkbox_mobile/src/spaceMembers.ts](src/spaceMembers.ts)
	- [sparkbox_mobile/src/invitePreview.ts](src/invitePreview.ts)
	- [sparkbox_mobile/src/appShell.ts](src/appShell.ts)

### 3.4 组件层（src/components）

#### 3.4.1 Chat 相关
- [sparkbox_mobile/src/components/ChatsPane.tsx](src/components/ChatsPane.tsx)
- [sparkbox_mobile/src/components/ChatInboxPane.tsx](src/components/ChatInboxPane.tsx)
- [sparkbox_mobile/src/components/ChatDetailPane.tsx](src/components/ChatDetailPane.tsx)
- [sparkbox_mobile/src/components/ChatInspirationPane.tsx](src/components/ChatInspirationPane.tsx)
- [sparkbox_mobile/src/components/ChatSpaceToolsPane.tsx](src/components/ChatSpaceToolsPane.tsx)

#### 3.4.2 Library / Settings / Household
- [sparkbox_mobile/src/components/LibraryPane.tsx](src/components/LibraryPane.tsx)
- [sparkbox_mobile/src/components/LibraryQuickActionsCard.tsx](src/components/LibraryQuickActionsCard.tsx)
- [sparkbox_mobile/src/components/SettingsSummaryPane.tsx](src/components/SettingsSummaryPane.tsx)
- [sparkbox_mobile/src/components/SettingsDevicesPane.tsx](src/components/SettingsDevicesPane.tsx)
- [sparkbox_mobile/src/components/OwnerSettingsPane.tsx](src/components/OwnerSettingsPane.tsx)
- [sparkbox_mobile/src/components/HouseholdPeoplePane.tsx](src/components/HouseholdPeoplePane.tsx)

#### 3.4.3 Setup 与通用壳层
- [sparkbox_mobile/src/components/SetupFlowPane.tsx](src/components/SetupFlowPane.tsx)
- [sparkbox_mobile/src/components/SetupAccountCard.tsx](src/components/SetupAccountCard.tsx)
- [sparkbox_mobile/src/components/SetupUtilityModals.tsx](src/components/SetupUtilityModals.tsx)
- [sparkbox_mobile/src/components/ScannerOverlay.tsx](src/components/ScannerOverlay.tsx)
- [sparkbox_mobile/src/components/ShellHeader.tsx](src/components/ShellHeader.tsx)
- [sparkbox_mobile/src/components/ViewedSpaceCard.tsx](src/components/ViewedSpaceCard.tsx)

#### 3.4.4 Modal 与编辑器
- [sparkbox_mobile/src/components/TaskEditorModal.tsx](src/components/TaskEditorModal.tsx)
- [sparkbox_mobile/src/components/TaskHistoryModal.tsx](src/components/TaskHistoryModal.tsx)
- [sparkbox_mobile/src/components/ChatSessionEditorModal.tsx](src/components/ChatSessionEditorModal.tsx)
- [sparkbox_mobile/src/components/MemoryEditorModal.tsx](src/components/MemoryEditorModal.tsx)
- [sparkbox_mobile/src/components/RelayComposerModal.tsx](src/components/RelayComposerModal.tsx)
- [sparkbox_mobile/src/components/SpaceCreatorModal.tsx](src/components/SpaceCreatorModal.tsx)
- [sparkbox_mobile/src/components/SpaceMembersEditorModal.tsx](src/components/SpaceMembersEditorModal.tsx)

### 3.5 测试结构
- 每个核心模块都配有同名或相邻测试文件，覆盖：
	- 认证流程
	- onboarding 流程
	- API 映射与错误处理
	- space/权限规则
	- app shell 文案与状态派生
- 测试样例入口可见于 [sparkbox_mobile/src](src)

### 3.6 当前移动端架构结论（简明）
- 这是一个“单入口重编排”的架构：App.tsx 较重，但业务闭环完整。
- API 层和规则层拆分较清晰：householdApi + *Shell/*State 文件承担了大量可测试逻辑。
- 组件层已经按域拆分（chat/library/settings/setup/modal），具备后续继续抽 hook 的基础。


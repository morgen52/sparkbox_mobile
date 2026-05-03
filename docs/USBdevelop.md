# Sparkbox 外接存储导入开发说明

本文说明如何在本地开发环境中，不插真实 U 盘，也能模拟“Jetson 读取外接存储并导入到 Raw”的完整流程。

---

## 1. 功能目标

当前实现支持这样的开发与验证路径：

1. 用户将 U 盘或移动硬盘插入 Jetson。
2. mobile 端进入某个 Space 的“资料库”。
3. 点击“外接存储导入”。
4. Jetson 扫描外接存储挂载点。
5. mobile 展示目录和文件列表。
6. 用户勾选文件或文件夹。
7. Jetson 按正式 Raw 导入流程写入当前 Space，而不是裸复制。

这意味着导入过程中会同步维护：

- `raw/` 目录内容
- `directory.json`
- owner 信息
- 后续 Wiki / 整理 / 摘要链路所需的数据状态

---

## 2. 本地开发模拟入口

为了方便在 Windows / 本地开发机上联调，Jetson 端支持通过环境变量 `EXTERNAL_IMPORT_ROOTS` 指定“外接存储根目录”。

只要设置这个变量，mobile 中的“外接存储导入”页面就会把这些目录显示成可浏览、可导入的设备。

---

## 3. 操作步骤

### 3.1 准备一个本地模拟目录

例如在 PowerShell 中创建：

```powershell
mkdir d:\temp\usb-demo
mkdir d:\temp\usb-demo\docs
mkdir d:\temp\usb-demo\photos

"这是家庭旧资料" | Out-File -Encoding utf8 d:\temp\usb-demo\docs\family-history.txt
"老照片说明" | Out-File -Encoding utf8 d:\temp\usb-demo\photos\readme.txt
```

你也可以把一些真实文档、图片、扫描件直接复制进去，用来模拟 U 盘中的老资料。

---

### 3.2 启动 Jetson 前设置环境变量

在**启动 Jetson 服务的同一个 PowerShell 终端**中执行：

```powershell
$env:EXTERNAL_IMPORT_ROOTS="d:\oldfiles"
```

如果要一次模拟多个外接设备，可以用分号分隔多个目录：

```powershell
$env:EXTERNAL_IMPORT_ROOTS="d:\temp\usb-demo;d:\temp\usb-demo-2"
```

---

### 3.3 重启 Jetson 服务

如果 Jetson 服务已经在运行，设置完环境变量后必须重启。

```powershell
cd d:\gitRepo\sparkbox_jetson
uvicorn main:app --host 127.0.0.1 --port 8080 --reload
```

说明：

- 环境变量只对当前终端生效。
- 如果 Jetson 不是在这个终端启动的，服务进程就读不到该变量。

---

### 3.4 mobile 端验证导入

在手机或模拟器中：

1. 进入某个 Space
2. 打开“资料库”
3. 点击“外接存储导入”
4. 点击“扫描设备”
5. 选择一个模拟目录
6. 浏览内容并勾选文件/文件夹
7. 点击“导入已选”

导入成功后，文件会进入当前 Space 的 Raw 区域。

---

## 4. 导入后的存储位置

Jetson 本地的目标目录取决于当前 Space 类型：

- 私人空间：`data/person_space/users/{user_id}/raw/`
- 共享空间：`data/person_space/family/spaces/{space_id}/raw/`

注意：

这不是简单复制，而是会走正式导入逻辑，因此会同步更新 `directory.json`。

---

## 5. 与真实 U 盘场景的关系

开发时使用的是 `EXTERNAL_IMPORT_ROOTS` 指定目录。

在真实 Jetson 设备上，不设置该变量时，系统会自动扫描常见挂载位置，例如：

- `/media`
- `/run/media`
- `/mnt`

也就是说：

- **本地开发**：用目录模拟 U 盘
- **真实部署**：直接识别已挂载的外接存储

---

## 6. 常见问题

### 6.1 mobile 里扫描不到设备

优先检查：

- 是否在**启动 Jetson 的同一个终端**里设置了 `EXTERNAL_IMPORT_ROOTS`
- Jetson 服务是否已经重启
- 指定目录是否真实存在
- cloud / jetson / mobile 三端是否已经打通

---

### 6.2 导入后看不到文件

先确认：

- 当前是否导入到了正确的 Space
- 导入完成后是否刷新了 Raw 浏览页面
- Jetson 端对应目录下是否已经生成了文件
- `directory.json` 是否同步更新

---

### 6.3 为什么不能直接读取整个系统磁盘

这是出于安全边界考虑。

当前实现只允许浏览“可识别的外接存储根目录”，避免 mobile 端误读 Jetson 的系统文件、配置文件或其他非用户资料目录。

---

## 7. 推荐测试用例

建议至少验证下面几组情况：

1. **单文件导入**：选择一个 txt / md 文档导入
2. **文件夹导入**：选择整个 docs 文件夹导入
3. **多目录模拟**：配置两个根目录，确认 mobile 可以分别浏览
4. **导入后整理**：导入完成后继续执行 Wiki organize / summary / chat 问答
5. **边界情况**：空文件夹、超大文件、重复导入同名文件

---

## 8. 当前实现说明

当前版本已经支持：

- 扫描外接存储根目录
- 浏览目录
- 勾选文件或文件夹
- 递归导入文件夹中的文件
- 按 Raw 正式注册流程写入目标 Space

后续可以继续增强：

- 导入进度条
- 文件类型过滤
- 全选 / 反选
- 导入后自动触发一次整理
- 更好的重复文件处理策略

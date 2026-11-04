# T3 Code 账号与 T3 Connect

核对日期：2026-11-04，CLI `0.1.6`。本机已安装并运行后台服务，`t3 status` 显示 **Service installed · t3@0.1.6 / T3 Connect on / Local network off**。日常无需重复登录；以下说明本地网页、官方网页版和跨设备连接的使用方式。

## 本地网页与官方网页版

| 入口 | 网页来源 | 连接方式 |
| --- | --- | --- |
| <http://127.0.0.1:3773> | 当前设备运行的 T3 服务 | 默认连接当前设备上的服务，也可在客户端添加远程环境 |
| <https://app.t3.codes> | 官方托管的网页客户端 | 本文使用 T3 Connect：在网页登录 T3 账号，再选择要连接的主机 |

`127.0.0.1` 始终指浏览器所在的设备：在另一台电脑打开这个地址，连接的是那台电脑自己的 T3 服务。查看本机项目时，需要在客户端连接到本机对应的环境。

**选择的环境决定项目和任务位于哪台机器。** 两种网页入口连接同一台主机时，访问的是该主机已有的项目和会话。文件、模型凭据与任务进程都保留在那台主机上。

T3 账号用于关联、发现和授权连接主机。同账号登录不会自动将一台主机的项目目录复制到另一台机器；`app.t3.codes` 提供网页客户端，任务由选中的主机执行。

## 1. 主机首次配置与 T3 账号登录

在执行任务、保存项目文件的主机上操作。先确保 `t3` 命令可用，安装及命令入口恢复见 [README.md](./README.md)。需要固定端口或监听地址时，可先按 [后台服务配置](./usage.md#7-后台服务与自启动) 写好 `~/.t3/service.env`。

`t3 up` 是远程访问与后台服务的配置向导，会询问使用 T3 Connect、局域网或两者。明确使用 T3 Connect 时直接运行：

```bash
t3 up --connect
```

1. 按终端提示在浏览器登录 T3 账号，确认并授权这台主机；已有有效授权时可复用。
2. 让命令完成环境关联和 T3 Connect 配置。在 Linux Mint 上，这个流程还会安装／启动后台服务，已有服务需要时会重启。
3. 配置完成后检查状态，再从手机或另一台电脑连接。

**先等待现有 Agent 任务结束再配置。** `t3 up` 可能重启实例；没有交互终端时，需要的重启会直接执行。

无浏览器或通过 SSH 配置时，显式使用：

```bash
t3 up --connect --headless
```

终端会给出登录网址和短码。在任意有浏览器的设备打开网址，确认短码并授权，主机上的 CLI 会继续执行。SSH 环境也会自动采用这种方式。

`t3 connect` 是 `t3 up --connect` 的同义入口。两者都包含远程访问和后台服务设置；完成后确认服务正常即可，无需另跑一次 `t3 service install`。未指定的访问方式会保留原配置，`--connect` 不会顺带修改局域网开关。

### 只登录账号，暂不启用远程访问

```bash
t3 connect login
```

无浏览器时可加 `--headless`。此命令只保存 T3 Connect CLI 的账号授权；后续要开通远程访问，再运行 `t3 up --connect`。

T3 账号、设备配对与模型账号各有用途：`t3 pair` 给浏览器或设备生成一次性配对码，不登录 T3 账号；主机上 Codex、Claude 等模型账号仍需单独配置。仅在本机使用 T3 时无需 T3 账号。

### 配置完成后的检查

```bash
t3 status
t3 service status
t3 connect status
```

- `t3 status`：查看服务是否安装、T3 Connect 是否启用，以及局域网开关。
- `t3 service status`：检查受管理的后台服务及日志位置。
- `t3 connect status`：检查 T3 Connect 配置和从主机侧检测的远程地址可达性。

`T3 Connect on` 表示已经启用配置；远程连通还取决于隧道、服务和客户端网络。最后应从目标设备实际选中该主机并连接。

## 2. 手机和另一台电脑如何连接

### 在另一台电脑查看本机项目

把当前这台 Dell 电脑称为 **A**，另一台电脑称为 **B**：

1. A 上完成第 1 节的 `t3 up --connect` 配置。保持 A 开机、唤醒、联网，T3 服务持续运行；本机目前已启用 T3 Connect。
2. 在 B 的浏览器打开 <https://app.t3.codes>。
3. 在网页中登录与 A 相同的 T3 账号。即使已在 B 的命令行授权过账号，浏览器客户端仍需完成自己的登录。
4. 在环境列表或 **Settings → Environments** 中找到 **A 这台主机**，将它添加／连接为客户端环境。
5. 打开 A 上已有的项目和会话，即可查看文件、继续对话或执行任务。任务实际运行在 A 上。

手机打开 T3 Code App，或 B 使用桌面 App 时，同样登录这个账号，再选择 A 对应的环境。

### 两台电脑都执行 `t3 up --connect` 的作用

- A 和 B 分别执行此命令并关联同一账号后，两台电脑都可以作为供其他设备连接的主机。
- 在 B 执行该命令是配置 B 的服务和远程访问；查看 A 的项目时，仍需在浏览器或 App 中选择 A 对应的环境。
- 如果 B 只用来访问 A，直接在 B 的浏览器打开官方网页版并登录即可，无需为此安装 T3 或运行 `t3 up --connect`。

因此，在 B 的本地网页看不到 A 的项目时，先检查客户端是否已经添加并连接 A，以及当前打开的项目属于哪台主机。

使用桌面版作为主机时，也可在 **Settings → Sharing & access** 登录 T3 账号并启用该环境的 **T3 Connect**。

## 3. 登录后仍无法连接

若提示 `NOT reachable` 或 `has not set up a T3 Connect tunnel`，先在主机运行 `t3 connect status`，并查看服务日志。确认 T3 Connect 已启用、主机服务正在运行。

若账号关联已保存，但运行中的服务还未应用配置，等待任务结束后重启，再检查：

```bash
t3 service restart
t3 connect status
```

如果显示未登录或 T3 Connect 未启用，再按提示运行 `t3 connect` 完成配置。2026-11-03 本机首次配置时曾遇到隧道未建立，补跑 `t3 connect` 并重启后解决；这些是故障处理步骤，配置正常时无需每次执行。

主机侧检查通过后，仍需确认客户端使用同一账号且网络可用。更多诊断见[官方排障文档](https://github.com/pingdotgg/t3code/blob/v0.1.6/docs/user/t3-connect-troubleshooting.md)。

## 4. T3 账号提供的额外功能

- **环境发现与连接**：手机、浏览器和桌面 App 登录同一账号后，可以选择已关联的主机，减少手动复制配对链接。
- **后台手机通知**：任务完成、失败、需要审批或回答问题时接收提醒；需要关联环境、启用活动发布，并在 **Settings → Notifications** 开启 **Device Notifications**。
- **活动状态通知**：支持 Android ongoing activity／Live Updates 与 iOS Live Activities，实际能力取决于系统和设置。

直接连接不提供上述后台推送。Android 推送要求 Android 7.0 或更新版本及 Google Play 服务；没有 Google Play 服务的手机需要留意这项限制。

## 5. 费用与模型账号

费用与额度信息记录于 2026-11-03：官方说明 T3 Code 免费、开源，T3 Connect 当前也免费，每个账号可关联 3 台运行 T3 Code 的电脑；手机和浏览器不占该数量。

关联付费 T3 Chat 账号可提高 T3 Connect 主机数量上限：Pro 为 10 台，Premier 为 100 台。数量和服务政策以官方后续公布为准。

T3 Code 的账号负责连接和相关账号功能；模型调用仍使用主机上配置的 Codex、Claude 等提供商账号或 API 密钥及其额度。登录 T3 Code 不会自动获得额外模型额度。

## 官方参考

- [T3 Connect 与远程访问（0.1.6）](https://github.com/pingdotgg/t3code/blob/v0.1.6/docs/user/remote-access.md#t3-connect)
- [后台服务与自启动（0.1.6）](https://github.com/pingdotgg/t3code/blob/v0.1.6/docs/user/background-service.md)
- [T3 Connect 排障（0.1.6）](https://github.com/pingdotgg/t3code/blob/v0.1.6/docs/user/t3-connect-troubleshooting.md)
- [手机通知与系统要求](https://github.com/pingdotgg/t3code/blob/main/docs/user/mobile-notifications.md)
- [费用、主机数量与账号 FAQ](https://github.com/pingdotgg/t3code/blob/main/docs/user/faq.md)

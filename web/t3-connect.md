# T3 Code 账号与 T3 Connect

记录日期：2026-11-03。本机已跑通 `t3 up --connect`，`t3 status` 显示 **Service installed · t3@0.1.6 / T3 Connect on**。但 `t3 up` 末尾曾提示 tunnel 未建立，需再跑 `t3 connect` 并 `t3 service restart` 才算完全可达，见下文。

## 1. 连接方式

手机和另一台电脑登录同一 T3 账号后，从环境列表选择已关联的主机即可连接，前提是主机已启用 T3 Connect。

电脑执行任务，电脑与 T3 服务需要保持运行。

## 2. 手机和另一台电脑如何连接

1. 主机上打开 T3 Code，在 **Settings → Sharing & access** 登录 T3 账号，并启用该环境的 **T3 Connect**。
2. 手机打开 T3 Code App；另一台电脑可以使用桌面 App 或 [网页版](https://app.t3.codes)。
3. 客户端登录同一个 T3 账号，从环境列表选择主机。
4. 进入主机上的项目和对话，查看文件、执行任务或使用终端。文件、模型凭据与执行进程保留在主机上。

如果希望两台电脑都能作为被操作的主机，需要分别运行 T3 Code 并启用各自的 T3 Connect 环境。

电脑端登录账号（2026-11-03 在本机用 `t3 status` / `t3 up --help` / `t3 pair --help` 确认过入口）：

```bash
t3 up --connect
```

- 按终端给出的网址去浏览器登录 T3 账号，按提示完成关联。
- 无浏览器或走 SSH 时用 `t3 up --headless`，会给出 URL + code，换一台有浏览器的设备输码登录。
- `t3 connect` 是 `t3 up --connect` 的同义入口，效果一样。
- 登录后检查：

```bash
t3 status
```

看到 `T3 Connect on` 才算主机已启用；本机已显示 `on`。若 `t3 up --connect` 末尾提示 `NOT reachable / has not set up a T3 Connect tunnel`，按提示补跑 `t3 connect`，再 `t3 service restart`，然后重查 `t3 status`。

注意 `t3 pair` 不是登账号，只是给浏览器/手机生成一次性配对码（默认约 5 分钟有效、一次性），不要和账号登录混用。

` t3 up` 会引导远程访问与后台服务设置，可能需要切换或重启现有实例；选择合适时机手动配置。本次记录没有运行该配置命令或改变已有服务。

仅登录账号不等于已启用远程连接，主机还需要启用 T3 Connect 并保持服务运行。

## 3. T3 账号提供的额外功能

- **环境发现与连接**：手机、浏览器和桌面 App 登录同一账号后，可以选择已关联的主机，减少手动复制配对链接。
- **后台手机通知**：任务完成、失败、需要审批或回答问题时接收提醒；需要关联环境、启用活动发布，并在 **Settings → Notifications** 开启 **Device Notifications**。
- **活动状态通知**：支持 Android ongoing activity／Live Updates 与 iOS Live Activities，实际能力取决于系统和设置。

直接连接不提供上述后台推送。Android 推送要求 Android 7.0 或更新版本及 Google Play 服务；没有 Google Play 服务的手机需要留意这项限制。

## 4. 费用与模型账号

截至记录日期，官方说明 T3 Code 免费、开源，T3 Connect 当前也免费，每个账号可关联 3 台运行 T3 Code 的电脑；手机和浏览器不占该数量。

关联付费 T3 Chat 账号可提高 T3 Connect 主机数量上限：Pro 为 10 台，Premier 为 100 台。数量和服务政策以官方后续公布为准。

T3 Code 的账号负责连接和相关账号功能；模型调用仍使用主机上配置的 Codex、Claude 等提供商账号或 API 密钥及其额度。登录 T3 Code 不会自动获得额外模型额度。

## 官方参考

- [T3 Connect 与远程访问](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md#t3-connect)
- [手机通知与系统要求](https://github.com/pingdotgg/t3code/blob/main/docs/user/mobile-notifications.md)
- [费用、主机数量与账号 FAQ](https://github.com/pingdotgg/t3code/blob/main/docs/user/faq.md)

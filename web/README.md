# T3 Code：Codex Web 前端

这里使用 **T3 Code** 作为 Codex 的 Web 前端。它通过 Codex App Server 调用本机或远程机器上的 Codex，提供聊天、项目文件浏览、Markdown／公式预览和 HTML 页面预览。

- 项目：<https://github.com/pingdotgg/t3code>
- 下载：<https://github.com/pingdotgg/t3code/releases/latest>
- 官方安装文档：<https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md>
- 日常命令、关闭方式、SSH 和公式设置：[usage.md](./usage.md)
- 后台常驻、自启动与 `t3 service install`：[后台服务](./usage.md#7-后台服务与自启动)
- 本地网页与 `app.t3.codes`、T3 账号及跨电脑连接：[t3-connect.md](./t3-connect.md)

## 本机安装

本机使用 **便携版／解压版**：Linux x64 官方独立可执行文件，版本 `0.1.6`，手动下载 Release 解压使用，未改 Node.js 环境。该程序提供 CLI 与 Web 服务，日常通过浏览器使用。以下状态于 2026-11-04 核对：

| 项目 | 路径／状态 |
| --- | --- |
| 命令入口（约定） | `~/.local/bin/t3`，指向实际程序的软链接；本次核对时入口缺失，恢复方法见下文 |
| 实际程序 | `~/.t3/runtime/versions/0.1.6/t3` |
| 数据目录 | `~/.t3/`，项目、会话和设置主要在 `~/.t3/userdata/` |
| 后台服务 | `t3code.service` 已安装、运行并启用自启动，`Linger=yes` |
| 访问方式 | 本机 `127.0.0.1:3773`；T3 Connect 已启用，局域网直连关闭 |

`.t3` 是隐藏目录。文件管理器按 **Ctrl+L**，输入 `/home/dell/.t3/runtime/versions/0.1.6/` 可直接找到程序；也可按 **Ctrl+H** 显示隐藏文件。

安装步骤（以 `0.1.6` 为例）：

```bash
grep '  t3-0.1.6-linux-x64.tar.gz$' SHA256SUMS | sha256sum --check --strict
```

校验通过后保留压缩包内目录结构，解压到 `~/.t3/runtime/versions/0.1.6/`，再建立软链接：

```bash
mkdir -p "$HOME/.local/bin"
ln -s "$HOME/.t3/runtime/versions/0.1.6/t3" "$HOME/.local/bin/t3"
command -v t3
t3 --version
```

本机程序仍在上述实际路径，后台服务直接使用它运行。入口缺失时，可用上面的 `ln -s` 恢复；也可先用完整路径检查状态：

```bash
"$HOME/.t3/runtime/versions/0.1.6/t3" status
```

## 安装程序后还要做什么

**安装 `t3` 程序和安装后台服务是两个步骤。** 下载解压或官方 `install.sh` 安装 CLI 后，不代表已配置自启动；按使用方式选择下一步：

| 使用需求 | 下一步 | 是否需要 T3 账号 |
| --- | --- | --- |
| 临时在本机使用 | `t3` 或 `t3 serve`，详见 [启动方式](./usage.md#1-启动) | 无需 T3 账号；模型提供商仍需单独登录 |
| 希望关掉终端后继续运行、开机自动启动 | `t3 service install` | 无需 T3 账号 |
| 手机或另一台电脑通过 T3 Connect 连接 | `t3 up --connect`，按提示登录并授权主机 | 需要；此流程会一并设置后台服务 |
| 只授权 T3 账号，暂不启用远程访问 | `t3 connect login` | 需要；此命令只做账号授权 |

`t3 up` 是远程访问与后台服务的配置向导，可以选择 T3 Connect、局域网或两者。完成 `t3 up --connect` 并确认服务正常后，无需再单独执行 `t3 service install`，也不必每次打开网页都运行 `t3 up`。

本机现已使用后台服务，日常直接打开 <http://127.0.0.1:3773>。在另一台电脑查看本机项目，可打开 <https://app.t3.codes>，登录同一 T3 账号，再选择本机对应的环境；那台电脑只作为客户端时无需运行 `t3 up --connect`。

两种网页入口的区别和跨电脑操作步骤见 [t3-connect.md](./t3-connect.md#本地网页与官方网页版)，后台服务管理见 [usage.md](./usage.md#7-后台服务与自启动)。

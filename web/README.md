# T3 Code：Codex Web 前端

这里使用 **T3 Code** 作为 Codex 的 Web 前端。它通过 Codex App Server 调用本机或远程机器上的 Codex，提供聊天、项目文件浏览、Markdown／公式预览和 HTML 页面预览。

- 项目：<https://github.com/pingdotgg/t3code>
- 下载：<https://github.com/pingdotgg/t3code/releases/latest>
- 官方安装文档：<https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md>
- 日常命令、关闭方式、SSH 和公式设置：[usage.md](./usage.md)
- T3 Code 账号、T3 Connect 与跨电脑连接：[t3-connect.md](./t3-connect.md)

## 本机安装

本机 `0.1.6`，Linux x64 官方独立可执行文件，手动下载 Release 安装，未改 Node.js 环境：

| 项目 | 路径／状态 |
| --- | --- |
| 命令入口 | `~/.local/bin/t3`，是指向实际程序的软链接 |
| 实际程序 | `~/.t3/runtime/versions/0.1.6/t3` |
| 数据目录 | `~/.t3/`，项目、会话和设置主要在 `~/.t3/userdata/` |

安装步骤（以 `0.1.6` 为例）：

```bash
grep '  t3-0.1.6-linux-x64.tar.gz$' SHA256SUMS | sha256sum --check --strict
```

校验通过后保留压缩包内目录结构，解压到 `~/.t3/runtime/versions/0.1.6/`，再建立软链接：

```bash
ln -s ~/.t3/runtime/versions/0.1.6/t3 ~/.local/bin/t3
command -v t3
t3 --version
```

日常启动、配对、Codex 登录检查见 [usage.md](./usage.md)。跨电脑连接使用 T3 Connect，见 [t3-connect.md](./t3-connect.md)。

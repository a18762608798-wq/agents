# T3 Code 使用与管理

安装及下载方式见 [README.md](./README.md)。以下使用本机约定的 `127.0.0.1:3773`；其他机器按实际参数调整。

## 1. 启动

启动服务并打开浏览器：

```bash
t3 --host 127.0.0.1 --port 3773 "$HOME"
```

仅启动服务：

```bash
t3 serve --host 127.0.0.1 --port 3773 "$HOME"
```

也可以把最后的工作目录换成项目路径：

```bash
t3 --host 127.0.0.1 --port 3773 /path/to/project
```

- Web 地址：<http://127.0.0.1:3773>。
- 已有同一实例运行时，直接打开网页，不要重复启动。
- 最后的路径指定工作目录；也可以在网页中使用 **Add project** 添加项目，再选择 Codex 新建会话。
- 本机暂未启用公网访问、LAN 监听或后台自启动。

### 可选：手动放到后台

```bash
mkdir -p "$HOME/.t3/logs"
log_file="$(mktemp "$HOME/.t3/logs/manual-XXXXXXXX.log")"
nohup env T3CODE_TELEMETRY_ENABLED=false \
  t3 serve --host 127.0.0.1 --port 3773 "$HOME" \
  > "$log_file" 2>&1 < /dev/null &
printf 'PID: %s\n日志: %s\n' "$!" "$log_file"
```

该方式不安装自启动服务；`T3CODE_TELEMETRY_ENABLED=false` 关闭此进程的产品使用统计。

## 2. 关闭与重启

### 前台启动

在运行 T3 的终端按 **Ctrl+C**。

**关闭浏览器标签页不会关闭 T3 服务。** 停止服务会中断正在进行的 Agent 任务、终端和客户端连接，先确认任务状态。

### 手动后台启动

先查监听端口的进程：

```bash
ss -ltnp 'sport = :3773'
```

从输出中找到 PID，核实它是对应 T3 实例后再发送 `TERM`。例如，**把下面的 `12345` 替换为实际 PID**：

```bash
ps -p 12345 -o pid,etime,args
kill -TERM 12345
```

不要长期记录并复用某个固定 PID，也不要直接终止所有 Node.js 进程。重启就是先停止该实例，再运行前面的启动命令。

T3 Code `0.1.6` 没有通用的 `t3 stop` 或 `t3 service stop` 命令；不要与其他 Web 前端的命令混用。

## 3. 常用命令

| 命令 | 用途 |
| --- | --- |
| `t3 --version` | 查看安装版本 |
| `t3 --help` | 查看全部命令 |
| `t3 serve --help` | 查看监听地址、端口等启动参数 |
| `t3 pair` | 为正在运行的服务生成一次性配对码／链接 |
| `t3 status` | 查看后台服务安装情况和远程访问配置，不等同于手动进程的运行状态 |
| `t3 update` | 下载并切换到更新版本 |
| `t3 service status` | 查看受管理后台服务的状态及日志位置 |

手动启动的服务不会因为执行 `t3 update` 自动重启；更新后需自行停止旧实例，再重新启动。

## 4. 配对与登录

首次打开网页或换一个浏览器时，可能需要配对：

```bash
t3 pair
```

- 打开终端给出的一次性链接，或把配对码填入网页。
- 默认有效期约 5 分钟，只能兑换一次；失效后重新运行命令。
- 这是浏览器与 T3 服务的配对，不是重新登录 Codex。
- 配对链接相当于临时密码，不要公开或写入 Git。

Codex 的登录状态在服务所在机器上检查：

```bash
codex login status
```

## 5. 数学公式显示

在使用 T3 的浏览器中打开：

**左侧边栏底部 Settings → Appearance → Math → 开启 Render math**。

开启后，聊天消息和 Markdown 文件预览都可使用 KaTeX 渲染公式。设置按浏览器／设备单独保存，换浏览器需要重新开启。

行内公式示例：这是 $E=mc^2$ 公式。

独立公式示例：

$$
\int_0^1 x\,\mathrm{d}x=\frac{1}{2}
$$

公式应放在代码块和行内代码之外；只支持 KaTeX 支持的 LaTeX 命令，不等于完整的 LaTeX 编译环境。

HTML 页面预览是另一项能力：若 HTML 依赖 MathJax／KaTeX 脚本、字体或外部资源，应单独检查资源是否能加载，不能只凭开启 Render math 就认定任意 HTML 公式都能工作。

## 6. SSH 远程访问

在远程机器安装并登录 Codex、安装 T3，再启动仅监听回环地址的服务：

```bash
t3 serve --host 127.0.0.1 --port 3773 /path/to/project
```

在本地电脑建立端口转发：

```bash
ssh -N -L 3773:127.0.0.1:3773 user@remote-host
```

然后在本地浏览器访问 <http://127.0.0.1:3773>。在远程机器运行 `t3 pair` 获取配对码，并保持 SSH 隧道开启。若远程生成的链接使用了其他主机名，在本地页面直接粘贴配对码即可。

- 本地 `3773` 被占用时，可改为 `ssh -N -L 3774:127.0.0.1:3773 user@remote-host`，浏览器访问 `http://127.0.0.1:3774`。
- 项目文件、Agent 进程和 Codex 凭据都留在远程机器上。
- 内置的 **Settings → Environments → Add environment → SSH** 连接管理属于桌面版，不是纯 Web 功能。
- 不要为了远程访问直接把服务裸露到公网；优先 SSH 隧道或可信 VPN。

## 7. 可选：改为系统后台服务

本机尚未配置此模式。切换前先停止手动实例，避免同一数据目录被重复使用或端口冲突。

如需固定服务参数，可编辑 `~/.t3/service.env`，例如：

```dotenv
T3CODE_PORT=3773
T3CODE_HOST=127.0.0.1
T3CODE_TELEMETRY_ENABLED=false
```

然后安装并启动用户服务：

```bash
t3 service install
t3 service status
```

Linux 使用 systemd 用户服务。安装可能启用 lingering，使服务在开机或退出登录后继续运行；如需管理员权限，按工具提示由用户执行。

安装成功后，可用以下命令控制服务：

```bash
systemctl --user stop t3code.service     # 暂时停止，不移除自启动配置
systemctl --user start t3code.service    # 再次启动
t3 service restart                     # 重启
t3 service status                      # 检查状态和日志位置
```

修改 `service.env` 后，执行 `t3 service restart`。`t3 up` 还会引导远程访问和服务配置，不是单纯打开本机网页的命令，日常本地试用无需运行。

## 官方参考

- [安装](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md)
- [后台服务](https://github.com/pingdotgg/t3code/blob/main/docs/user/background-service.md)
- [远程访问与 SSH](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md)
- [外观与数学公式](https://github.com/pingdotgg/t3code/blob/main/docs/user/appearance.md#math)

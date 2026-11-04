# T3 Code 使用与管理

安装及下载方式见 [README.md](./README.md)。以下使用本机约定的 `127.0.0.1:3773`；其他机器按实际参数调整。

## 1. 启动

2026-11-04 核对：本机 `0.1.6` 已由 `t3code.service` 在后台运行并启用自启动，T3 Connect 已开启。**日常直接打开 <http://127.0.0.1:3773>**，无需再次启动或登录。检查状态：

```bash
t3 status
t3 service status
```

本机目前缺少 `t3` 命令入口；恢复软链接或使用完整路径的方法见 [README.md](./README.md#本机安装)。

在另一台电脑打开 `127.0.0.1:3773` 会连接那台电脑自己的服务。通过 `app.t3.codes` 查看本机项目的步骤，见[本地网页与官方网页版](./t3-connect.md#本地网页与官方网页版)。

### 未使用后台服务时：手动启动

以下命令适用于手动运行实例；已有同一数据目录的实例运行时，直接连接它，避免重复启动。需要从后台服务切换到手动运行时，先按第 2 节停止该服务。

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
- 本机 T3 服务只监听回环地址；手机和其他电脑通过 T3 Connect 连接，见 [t3-connect.md](./t3-connect.md)。

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

**关闭浏览器标签页不会关闭 T3 服务。** 停止或重启服务会中断正在进行的 Agent 任务、终端和客户端连接，操作前先等待任务结束。

### 本机当前使用的后台服务

| 操作 | 命令 |
| --- | --- |
| 暂时停止 | `systemctl --user stop t3code.service` |
| 再次启动 | `systemctl --user start t3code.service` |
| 重启 | `t3 service restart` |

临时停止会保留自启动配置；取消自启动见第 7 节。

### 前台启动

在运行 T3 的终端按 **Ctrl+C**。

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
| `t3 up` | 配置远程访问与后台服务；选择 T3 Connect 时会引导账号登录 |
| `t3 service install` | 安装并启动当前用户的后台服务，配置自启动 |
| `t3 update` | 下载并切换到更新版本 |
| `t3 service status` | 查看受管理后台服务的状态及日志位置 |
| `t3 connect status` | 检查 T3 Connect 配置及主机侧的远程可达性 |

手动启动的服务不会因为执行 `t3 update` 自动重启；更新后需自行停止旧实例，再重新启动。

## 4. 配对与登录

仅在本机浏览器使用 T3 不要求登录 T3 账号。下面三件事各有用途：

| 操作 | 用途 |
| --- | --- |
| `t3 up --connect` | 登录／授权 T3 账号，启用跨设备访问并设置后台服务 |
| `t3 pair` | 给可到达服务的浏览器或设备生成一次性配对码 |
| 模型提供商登录 | 让主机上的 Codex、Claude 等实际调用模型；与 T3 账号分别管理 |

首次打开网页或换一个浏览器时，可能需要配对：

```bash
t3 pair
```

- 打开终端给出的一次性链接，或把配对码填入网页。
- 默认有效期约 5 分钟，只能兑换一次；失效后重新运行命令。
- 这是浏览器与 T3 服务的配对，不是重新登录 Codex。
- 配对链接相当于临时密码，不要公开或写入 Git。

T3 账号的首次登录、无浏览器授权、只登录账号的 `t3 connect login`，以及手机连接步骤见 [t3-connect.md](./t3-connect.md)。完成配置后，日常打开网页无需重复运行 `t3 up`。

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

## 7. 后台服务与自启动

### 为什么需要 `t3 service install`

`t3 service install` 为当前用户安装并启动 systemd 服务 `t3code.service`，让 T3 不依赖打开的终端运行。Linux 安装流程会启用 lingering，使它在开机后自动启动，并在退出用户登录后继续运行。

- 临时本机使用，或愿意一直保留前台进程：可以直接用 `t3`／`t3 serve`。
- 希望后台常驻、开机自启，或让手机随时连接主机：适合安装后台服务；主机仍需保持开机、唤醒和联网。
- `t3 service install` 本身不登录 T3 账号，也不负责首次开通 T3 Connect；只在本机使用时无需 T3 账号。
- `t3 up --connect` 会完成账号授权、远程配置和后台服务设置。完成该流程后，无需再单独安装服务。

本机已经使用此模式。`t3 service install` 主要用于首次安装，或按状态提示修复损坏的服务，日常使用无需重复执行。

### 首次安装与配置

先等待任务结束，再停止手动启动的实例，避免同一数据目录被重复使用或端口冲突。如需固定服务参数，可编辑 `~/.t3/service.env`，例如：

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

以普通用户运行 `t3`。若启用 lingering 需要管理员权限，安装程序会打印需执行的恢复命令；按提示处理后再重试安装。

验证运行、自启动和退出登录后继续运行：

```bash
systemctl --user is-active t3code.service
systemctl --user is-enabled t3code.service
loginctl show-user "$(id -un)" -p Linger
```

正常应分别看到 `active`、`enabled`、`Linger=yes`；本机已确认这三项。服务单元位于 `~/.config/systemd/user/t3code.service`，日志位置可用 `t3 service status` 查询。

修改 `service.env` 后，等待任务结束，再执行 `t3 service restart` 使配置生效。

### 取消后台运行与自启动

只想暂时停止，使用第 2 节的 `systemctl --user stop t3code.service`。如果要停止服务并移除它的自启动配置：

```bash
t3 service uninstall
```

卸载服务会保留项目、会话和设置，之后仍可手动启动。T3 Connect 的账号授权与后台服务分别管理，退出 T3 Connect 账号不会自动卸载后台服务。

## 官方参考

- [安装](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md)
- [后台服务（0.1.6）](https://github.com/pingdotgg/t3code/blob/v0.1.6/docs/user/background-service.md)
- [远程访问与 SSH（0.1.6）](https://github.com/pingdotgg/t3code/blob/v0.1.6/docs/user/remote-access.md)
- [外观与数学公式](https://github.com/pingdotgg/t3code/blob/main/docs/user/appearance.md#math)

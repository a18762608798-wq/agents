# README

这里我们主要使用 `Agent of Empires`.

AoE（Agent of Empires）官方提供一键安装脚本，Linux 和 macOS 都支持。

### 1. 安装 AoE

**Ubuntu / Linux：**

先安装必要依赖：

```bash
sudo apt update
sudo apt install -y tmux curl
```

然后执行官方安装命令：

```bash
curl -fsSL https://raw.githubusercontent.com/agent-of-empires/agent-of-empires/main/scripts/install.sh | bash
```

**macOS（Homebrew）：**

```bash
brew install aoe
```

以上均为官方提供的安装方式。[Agent of Empires](https://www.agent-of-empires.com/docs/installation/?utm_source=chatgpt.com)

### 2. 验证安装

```bash
aoe --version
```

启动 TUI 界面：

```bash
aoe
```

### 3. 使用 Codex

在你的项目目录执行：

```bash
aoe add --cmd codex
```

也可以直接在 AoE 的 TUI 中创建 Codex 会话。

### 4. 启动 Web 界面

```bash
aoe serve --daemon
```

查看 Web 地址：

```bash
aoe url
```

如果你通过 SSH 远程连接，默认端口为 `8080`，可以在本地执行：

```bash
ssh -N -L 8080:127.0.0.1:8080 user@remote-host
```

随后使用浏览器访问 AoE 提供的本地地址。

### 5. 更新 AoE

以后更新只需要：

```bash
aoe update
```

官方文档：[AoE 安装指南](https://www.agent-of-empires.com/docs/installation/?utm_source=chatgpt.com)

**建议先用 `aoe` 体验 TUI，再启动 `aoe serve --daemon` 体验 Web 界面。** 这两种界面可以管理同一批会话，不需要分别创建 Agent。

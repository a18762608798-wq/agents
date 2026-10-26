---
name: env-proxy
description: 设置、测试和关闭本地代理环境变量。当用户提到代理、proxy、设置代理、配置代理、开代理、关代理、翻墙、科学上网，或访问 Google/GitHub/PyPI/npm 等网络超时失败需要走代理时使用此 skill。
---

# 代理设置 Skill

## 概述

通过设置 shell 环境变量，为当前 opencode 会话启用临时 HTTP/HTTPS/SOCKS5 代理。代理软件（如 Clash Party、Clash Verge、ClashX 等）需先在后台运行。

## 触发时机

用户提到以下任一场景：

- "设置代理"、"开代理"、"配置代理"、"关代理"、"测试代理"
- 访问 GitHub/Google/PyPI/npm 等网络超时或失败，需要走代理
- 询问代理端口、代理环境变量等相关问题

## 工作流程

### 1. 设置代理

在 bash 中执行（默认混合端口 7890）：

```bash
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export HTTP_PROXY="$http_proxy"
export HTTPS_PROXY="$https_proxy"
export all_proxy="socks5h://127.0.0.1:7891"
export ALL_PROXY="$all_proxy"
export no_proxy="localhost,127.0.0.1,::1"
export NO_PROXY="$no_proxy"
```

### 2. 测试代理

```bash
curl -I --max-time 10 https://www.google.com
```

返回 `HTTP/2 200` 等正常状态码说明代理生效；超时或连接失败则检查代理软件是否运行、端口是否正确。

### 3. 关闭代理

```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
unset all_proxy ALL_PROXY no_proxy NO_PROXY
```

## 注意事项

- 当前会话的 bash 是持久 shell，设置后对本会话后续所有命令生效，无需重复设置。
- 设置后所有 bash 网络操作都走代理；本地/内网服务若需直连，确认 `no_proxy` 是否覆盖，或临时关闭代理。
- 默认端口基于 Clash Party：混合 7890、SOCKS 7891、HTTP 7892。其他代理软件端口可能不同（如 Clash Verge 默认 7897），使用前先确认实际端口。
- `socks5h` 表示域名也交给代理端解析，通常比 `socks5` 更适合代理访问。
- git 等部分工具不读取 `http_proxy`，如需代理请单独配置（如 `git config --global http.proxy`）。

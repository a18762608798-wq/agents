# 安装

## 前提

- Linux Mint，已装 Python 3.11+。
- 已装 `uv` 和 Codex CLI；本目录只维护 Codex 集成。
- 一台机器装一次，不是每个项目都装。

## 步骤

```bash
uv tool install specify-cli==1.2.5
specify version
```

当前本机已验证版本为 `1.2.5`。升级时先核对 CLI 与集成的变更，再统一调整版本。
查新版本（只读，不改安装）：

```bash
specify self check
```

## 验证

```bash
specify version
codex --version
```

两项均能输出版本后，继续按 [Codex 项目配置](config.md) 初始化项目。

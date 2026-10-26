# 安装

## 前提

- Linux Mint，已装 Python 3.11+。
- 已装 `uv`（本机实测 `0.12.1`）和 OpenCode（本机实测 `1.18.32`）。
- 一台机器装一次，不是每个项目都装。

## 步骤

```bash
uv tool install specify-cli
specify version
```

锁定团队版本（避免升级导致模板行为漂移）：

```bash
uv tool install specify-cli \
  --from git+https://github.com/github/spec-kit.git@vX.Y.Z
```

把 `vX.Y.Z` 换成具体 release。查新版本（只读，不改安装）：

```bash
specify self check
```

## 验证

`specify version` 输出版本号即成功（本机实测 `1.0.12`）。

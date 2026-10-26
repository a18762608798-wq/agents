# 配置

## 前提

- 已按 `install.md` 装好 OpenSpec CLI。
- 站在你的项目根目录执行以下命令。

## 内容

初始化（告诉 OpenSpec 按 OpenCode 能识别的格式生成文件）：

```bash
openspec init --tools opencode
```

实测生成以下文件（OpenSpec 1.13.1）：

```text
.opencode/commands/opsx-{propose,explore,apply,update,sync,archive}.md
.opencode/skills/openspec-{propose,explore,apply-change,update-change,sync-specs,archive-change}/SKILL.md
openspec/{config.yaml,changes/,specs/}
```

OpenCode 会自动发现 `.opencode/commands` 和 `.opencode/skills`，无需额外对接。已在运行的 OpenCode 退出重进一次。

另外两个常用配置操作：

- 开额外 workflow：默认只装 6 个 core，`init` 会提示 `6 more workflows are available`，按需用 `openspec config profile` 开启（如 `verify`、`onboard`）。
- CLI 全局升级后，已有项目跑一遍 `openspec update`，重新生成 `.opencode/` 下的文件（不会自动更新）。

## 验证

```bash
ls .opencode/commands
openspec list
```

在 OpenCode 输入 `/` 能看到 `/opsx-propose` 等 6 个命令即成功。注意是 `/opsx-propose`（连字符），不是文档里常写的 `/opsx:propose`（冒号）。

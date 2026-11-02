# usage

## create project

| 选项 | 推荐设置 | 含义 |
|---|---|---|
| **Default base branch** | 留空 | 自动选择 Git 默认分支（如 `main`），作为新 Worktree 的起点。 |
| **Worktree by default** | Enabled | 每个新会话默认创建独立的 Git 工作目录和分支，避免不同会话互相覆盖代码。 |
| **Start in container by default** | Disabled | 不使用 Docker 容器，直接在本机运行 Agent。Codex 自身的沙箱仍可正常使用。 |
| **Scope** | Global | 让这个项目在所有 AoE Profile 中可见。 |
| **Allow override** | 不勾选 | 不允许通过其他 Profile 为同一路径注册覆盖配置。 |

## acp

```bash
aoe acp doctor --fix --adapter pi-acp
```

# 使用

## 前提

- 项目已 `openspec init --tools opencode`，在项目根目录启动 `opencode`。
- 记住两套接口：终端跑 `openspec ...`（管理项目），OpenCode 聊天框用 `/opsx-*`（真正干活）。

## 内容

### 先看懂 openspec/ 的结构

```text
openspec/
├── config.yaml      项目配置（profile、开关）
├── changes/         草稿区：每次变更各占一个 <name>/ 目录
│   ├── <name>/      proposal.md、design.md(plan)、tasks.md + 本次增量 spec
│   └── archive/     归档区：做完的变更搬到这里
└── specs/           定稿区：当前state的规范投影
```

`changes/` 按次，`specs/` 按能力：多次改登录功能，改的是同一个 `specs/auth/`，不会一次建一目录。

### `name` 是什么

每次变更的代号，一活一名，自己起，短横线小写，如 `add-dark-mode`、`add-jwt-auth`。`archive` 后变成 `changes/archive/<日期>-<name>/`。

### 两套入口：斜杠命令 vs skill

文档里 `/opsx-*` 这种叫**斜杠命令**（slash command），是你主动敲的（手动挡）；**skill**（`openspec-*`）是 OpenCode 按 description 自动套用的（自动挡）。同一套流程，对应关系：

| 你敲的斜杠命令 | 背后同一套流程的 skill |
|---|---|
| `/opsx-propose` | `openspec-propose` |
| `/opsx-explore` | `openspec-explore` |
| `/opsx-apply` | `openspec-apply-change` |
| `/opsx-update` | `openspec-update-change` |
| `/opsx-sync` | `openspec-sync-specs` |
| `/opsx-archive` | `openspec-archive-change` |

平时 skill 自动触发就够用；想明确走规范流程时，才手动敲斜杠命令。

### 主流程（核心只有三步）

```text
/opsx-propose <Change+Artifact> → 检查 proposal/spec/design/tasks → /opsx-apply → /opsx-archive
```

1. `/opsx-explore`: 理清楚Intend.
2. `/opsx-propose`: 阐述Intent.
—— 生成 `openspec/changes/<name>/` 下的 `proposal.md`, `specs/`, Design, Tasks.
3. 重点审核 `proposal.md` 和 `specs/`
4. `/opsx-apply` —— 按 `openspec/changes/<name>/tasks.md` 逐项写代码、跑测试、打勾。
`<name>` 一般不用写(AI会自动判断什么需要apply)：只有一个活跃变更时自动选中,
只有想明确指定时才写 `/opsx-apply <name>`（`/opsx-update`、`/opsx-archive` 同理）。
5. `/opsx-archive <name>` —— 归档spec: 1.合并进 `specs/`, 2.工作记录记入`change/archive`。

两个可选命令：

- `/opsx-update <name>` —— 需求中途变了（如改存 HttpOnly Cookie），先更新规范再 `/opsx-apply` 追上。
- `/opsx-sync` —— 没有工作记录记入的 `opsx-archive`。

不用记的：`openspec completion install` 只是 shell Tab 补全，可选；
`openspec list` / `show` / `validate` / `status` 是终端侧的查看检查命令。

## 验证

- OpenCode 输入 `/` 能看到 6 个 `/opsx-*` 命令。
- 跑完一次 propose 后 `openspec list` 能看到你的 change。

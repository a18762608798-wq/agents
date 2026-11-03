# Codex 项目配置

## 前提

- 已按 `install.md` 装好 `specify`。
- 在项目根目录操作，先检查 `git status` 并保留已有修改。
- 终端用 `specify ...` 安装和配置；在 Codex 会话中执行对应的 Spec Kit 流程。

## 初始化

新项目或尚未接入 Spec Kit 的项目：

```bash
specify init --here --integration codex --script sh
```

`--here` 使用当前目录，`--script sh` 生成 Linux Mint 使用的脚本。
非空目录先确认覆盖范围；只有确需覆盖时才加 `--force`。
已有 Spec Kit 项目改用 Codex 时，使用：

```bash
specify integration switch codex --script sh
```

更新已安装的 Codex 集成时使用 `specify integration upgrade codex --script sh`，
不重新初始化整个项目。

默认工作流的目录关系：

```text
your-project/
│
├── .agents/skills/speckit-*/SKILL.md   # Codex 的 Spec Kit skills
├── .specify/
│   ├── memory/
│   │   └── constitution.md      ★ 项目级规则(放跨 cycle 不变的规则)
│   │
│   ├── templates/               ← Spec Kit 自己的模板
│   ├── scripts/                 ← 自动化脚本
│   └── ...
│
└── specs/
    │
    └── 001-user-auth/
        ├── spec.md              # 需求或实验定义
        ├── plan.md              # 实现方案
        ├── tasks.md             # 实现任务和验证条件
        └── checklists/          # 需求质量检查
```

`.agents/skills/` 提供 Codex 的操作说明；`.specify/` 保存规则、模板和脚本。
`specs/` 在首次创建 feature 后产生，研究项目也可沿用已有的 `expXX` / `shared-XX` 命名。

先用 constitution 描述项目长期约束，再逐个 feature 纳入。完整流程见
[默认用法](usage/default.md)。

## 科研实验 preset 与论文 skills

实验使用 [scientific-computing preset](dev/scientific-computing/README.md)，
论文使用依赖 Exp 产物的 [scientific-paper 独立技能包](dev/scientific-paper/README.md)。
实验沿用 Spec Kit；论文直接维护大纲与正文，无需 Paper spec 或 preset 优先级切换。
两类领域 skills 按各自说明安装到项目 `.agents/skills/`。
模板和命令的自定义方式见 [自定义说明](usage/self-define/README.md)。

## 项目工作约定与整体对齐

日常工作方式放在项目根 `AGENTS.md`，实验定义继续由各 feature 的 spec 维护。
科研项目可合并 [工作约定模板](dev/scientific-computing/templates/project-agents.md)，
保留项目原有规则。已有 feature 按影响增量维护，新实验走完整 Spec Kit 流程。

使用 scientific-computing preset 时：
- `$speckit-analyze 全项目` 检查所有 feature 与跨实验的规范关系。
- `$speckit-converge 全项目 仅检查` 只读核对实现与证据。
- `$speckit-converge 全项目` 按已存在的规范回填真正缺失的任务。
- 明确要求修复并对齐时，按问题所在层处理，再复查；证据不足保留“未核验”。

旧返工插件及其 marketplace、hook/MCP 安装配置已退役，项目无需安装返工插件。

## 验证

```bash
specify integration status
ls .agents/skills/speckit-*/SKILL.md
ls .specify
```

从项目根目录启动 Codex，确认可发现生成的 `speckit-*` skills。
在 Codex 聊天框用 `$speckit-constitution`、`$speckit-specify` 等原生 skill 入口开始流程，
不要在 shell 中执行这些调用。

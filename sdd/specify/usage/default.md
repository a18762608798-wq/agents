# default

> 这里提供原版的默认流程进行理解.

## 前提

- 项目已 `specify init --here --integration opencode`，在项目根目录启动 `opencode`。
- 记住：`specify init` 是终端 CLI；`/speckit.*` 是 OpenCode 聊天框里的 agent 命令，不要在 shell 里跑后者。

## 内容

### 先看懂目录关系

```text
.opencode/commands/   怎么执行 Spec Kit
.specify/             规则+模板+脚本（memory/templates/scripts）
specs/<NNN-name>/     每个功能的设计成果，重点 review 并提交 Git
src/                  最后实现的代码
```

`specs/` 是 `init` 时没有的，做第一个 feature 后才产生：

```text
.specify/
├── memory/
    └── constitution.md      ★ 项目级规则(放跨 cycle 不变的规则)

specs/
│
└── 001-user-auth/
    ├── spec.md              ★ 需求：WHAT / WHY(具体实验细节需求, 本cycle不变的规则)
    ├── tasks.md             ★ 实现任务(主要是门)
    └── checklists/
        └── requirements.md  ★ 需求质量检查(但是一般用不到, 除非有安全问题)
```

### 主流程

小功能短路径：

```text
/speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement → /speckit.converge
```

生产级全路径：

```text
/speckit.constitution → /speckit.specify → /speckit.clarify → /speckit.plan → /speckit.checklist → /speckit.tasks → /speckit.analyze → /speckit.implement → /speckit.converge
```

各步只做一件事：

- `/speckit.constitution`：定一次(就最开始)，管长期（如 REST/架构/测试/错误格式约束）。
- `/speckit.specify`：只讲 what/why，不讲技术栈。
- `/speckit.clarify`：消歧义，必须在 plan 之前, **类似gril me, 但是轻量, 空命令让ai提问就可以**。
- `/speckit.plan`：定技术栈和设计。
- `/speckit.checklist`：给需求做质量门禁, 类似精确的收敛条件(**有风险的任务采用, 一般不需要**)。
- `/speckit.tasks`：拆出可执行任务。
- `/speckit.analyze`：只读检查 spec/plan/tasks 一致性，有问题回源头改。
- `/speckit.implement`：这时才写代码。
- `/speckit.converge`：对照 spec 查遗漏，未收敛则补 tasks 再 implement。

### 人应该做什么

对于一个项目, 人应该做什么?

## 验证

- 跑完一次 `/speckit.specify` 后 `specs/` 下多出一个编号目录。
- 跑完 `/speckit.analyze` 无阻断性冲突后再 `/speckit.implement`。

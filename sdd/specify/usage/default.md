# Codex 默认流程

> 这里提供原版的默认流程进行理解.

## 前提

- 项目已按 [Codex 配置](../config.md) 初始化，在项目根目录启动 Codex。
- `specify init` 是终端 CLI；下文 `$speckit-*` 是 Codex 原生 skill 调用，
  在聊天框中输入，不在 shell 中执行。

## 内容

### 先看懂目录关系

```text
.agents/skills/       Codex 执行 Spec Kit 的 skills 与项目领域 skills
AGENTS.md             项目日常工作约定（按影响增量维护）
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
    ├── spec.md              ★ 科学定义与约束，按影响持续维护
    ├── tasks.md             ★ 具体实现工作与验证任务
    └── checklists/
        └── requirements.md  ★ 按需执行的需求质量检查
```

### 主流程

新 feature 的短路径：

```text
$speckit-specify → $speckit-plan → $speckit-tasks → $speckit-implement → $speckit-converge
```

生产级全路径：

```text
$speckit-constitution → $speckit-specify → $speckit-clarify → $speckit-plan → $speckit-checklist → $speckit-tasks → $speckit-analyze → $speckit-implement → $speckit-converge
```

各步只做一件事：

- `$speckit-constitution`：维护项目长期原则与约束。
- `$speckit-specify`：只讲 what/why，不讲技术栈。
- `$speckit-clarify`：在 plan 前澄清需求歧义。
- `$speckit-plan`：定技术栈和设计。
- `$speckit-checklist`：检查需求质量与验收条件。
- `$speckit-tasks`：拆出可执行任务。
- `$speckit-analyze`：只读检查 spec/plan/tasks 一致性，有问题回源头改。
- `$speckit-implement`：按任务实现并验证。
- `$speckit-converge`：对照 spec 查遗漏，未收敛则补 tasks 再 implement。

### 已有项目的增量维护与整体对齐

日常按项目根 `AGENTS.md` 修改受影响的规范和实现，不为普通修复重走完整流程。
科学定义变化先更新对应 spec，实现方案与 tasks 仅在受影响时同步。

使用 scientific-computing preset 时，可按需执行：

```text
$speckit-analyze 全项目
$speckit-converge 全项目 仅检查
```

前者检查文档与跨实验依赖，后者核对实际实现、结果与证据。
只读检查不写文件、不改变当前 feature 指针或分支，不自动重跑正式实验或提交真机任务。
需要任务回填时执行 converge 的任务收敛模式；明确要求修复时按问题所在层处理后复查。
报告区分“已对齐、存在偏离、未核验”，不以文件存在或任务勾选证明完成。

## 验证

- 跑完一次 `$speckit-specify` 后，`specs/` 下产生相应 feature 目录。
- 跑完 `$speckit-analyze` 无阻断性冲突后再 `$speckit-implement`。

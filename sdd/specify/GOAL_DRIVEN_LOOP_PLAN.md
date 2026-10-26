# Goal-Driven Loop Plan

## 1. 目标

在 Spec Kit 原生 SDD 的基础上，引入更成熟的目标驱动迭代和多 Agent 协同，同时保留当前项目的 rework gate，形成以下分层架构：

```text
官方 Spec Kit Workflow
    流程编排、循环、分支、暂停与恢复

MAQA 多 Agent 扩展
    Coordinator、Feature Agent、QA Agent、worktree 与任务状态

Spec Kit converge
    检查实现与 spec / plan / tasks 的整体差距

    当前 rework plugin
    先做上游影响评估，再按影响范围管理受控返工
```

核心原则：

```text
局部实现缺口       -> task loop
上游目标或设计变化 -> rework gate
多任务并行执行     -> MAQA
全局完成判定       -> converge / acceptance evaluation
```

## 2. 官方编排层

Spec Kit Workflow 作为外层状态机，负责把多个阶段串成可恢复的流程。可用能力包括：

- `command`：调用 `speckit.specify`、`speckit.plan`、`speckit.tasks`、`speckit.implement`、`speckit.converge` 等命令
- `prompt`：向 Agent 发出自定义评估或协调提示
- `shell`：运行测试、静态检查和报告脚本
- `gate`：人工审核和批准
- `if` / `switch`：按评估结果分支
- `while` / `do-while`：实现到目标达成为止的循环
- `fan-out` / `fan-in`：并行分发任务并汇总结果
- 暂停、失败后从精确步骤恢复
- Workflow overlay：不修改上游 Workflow 的情况下增加或替换步骤

官方 Workflow 提供的是通用编排能力，不自行定义：

- Goal 的语义
- Goal 的完成判定
- Agent 角色和职责
- worktree 冲突处理
- 任务依赖模型
- 是否自动合并代码

因此它是流程引擎，不是完整的多 Agent 研发方法论。

## 3. MAQA 执行层

MAQA 是社区扩展，负责把 Spec Kit 的任务转换成可调度的多 Agent 工作单元。

### 3.1 角色

#### Coordinator

- 读取 GitHub Issues、tasks 上下文和依赖
- 选择当前可执行的任务批次
- 生成 Feature Agent assignments
- 创建或复用独立 Git worktree
- 跟踪任务状态
- 在 QA、合并或阻塞后重新评估下一批任务

#### Feature Agent

- 在独立 worktree 中处理一个具体任务
- 读取 spec、plan、tasks 作为上下文
- 编写实现和测试
- 执行局部验证
- 提交 commit，并保留稳定任务关联信息

#### QA Agent

- 对已提交的任务实现进行验证
- 检查任务要求、测试和明显回归
- 根据项目配置检查安全性、链接、响应式、可访问性等质量项
- 通过或阻塞任务，必要时要求 Feature Agent 修复

### 3.2 典型任务状态

```text
open
  -> maqa:in-progress
  -> maqa:in-review
  -> closed

in-progress / in-review
  -> maqa:blocked
```

MAQA 当前以 GitHub Issues 作为权威任务状态源，`tasks.md` 主要提供实现上下文和依赖信息。并行 worktree 隔离工作目录，但不能消除 API、数据模型、共享文件和设计决策冲突。

### 3.3 任务批次示例

```text
T1 数据模型
T2 后端 API，依赖 T1
T3 前端列表，依赖 T2
T4 API 测试，依赖 T2
T5 端到端测试，依赖 T3、T4
```

可能的调度结果：

```text
Batch 1: T1
Batch 2: T2
Batch 3: T3、T4 并行
Batch 4: T5
```

每个任务的 Feature Agent 在独立 worktree 中实现，随后由对应 QA Agent 检查，Coordinator 在合并后重新评估任务图。

## 4. 三层 Loop

### 4.1 任务级 Loop

处理单个实现缺口：

```text
Feature Agent 实现
    -> QA Agent 验证
    -> 失败：修复或创建修复任务
    -> 通过：合并
```

### 4.2 Feature 级 Loop

处理整个 feature 与 Spec Kit 产物的差距：

```text
implement
    -> converge
    -> 若只是实现缺口：追加 task
    -> MAQA 调度新任务
    -> implement / QA / merge
    -> converge
    -> 直到 Converged
```

### 4.3 上游返工 Loop

处理目标、需求或技术设计发生变化：

```text
converge / QA 发现上游问题
    -> 阻塞受影响任务
    -> rework impact assessment
    -> 仅对受影响层及其下游依赖执行 gate
    -> 按 spec -> plan -> tasks -> checklists 顺序处理
    -> 同步更新 Issues
    -> 使旧 assignments 失效
    -> Coordinator 重新调度
```

## 5. 问题分类和处理规则

| 问题 | 处理 |
|---|---|
| 漏写代码 | 增加 implementation task |
| 测试缺失 | 增加 verification task |
| 实现偏离既有 spec | 修实现或增加修复 task |
| task 依赖错误 | 修改 tasks，必要时触发 rework |
| 技术方案不合理 | 修改 plan，再同步 tasks |
| 验收条件错误或矛盾 | 修改 spec，再同步 plan/tasks |
| Agent 之间代码冲突 | Coordinator 或人工处理合并 |
| 局部 QA 失败 | 返回对应 Feature Agent 或创建修复 assignment |
| 局部任务都通过但整体不达标 | 由 feature-level converge 继续判断 |

不能把所有问题都追加到 `tasks.md`。如果问题来自 spec 或 plan，必须修改问题源头，并使受影响的下游任务和 Agent 上下文失效或重新生成。

## 6. 与当前 rework plugin 的衔接

当前插件位于治理层，负责先判断上游影响，再对必要的产物修改施加阶段约束：

```text
impact assessment -> affected stages -> implementation
```

推荐的两条路径：

### 普通实现路径

```text
MAQA Coordinator
    -> Feature Agent
    -> QA Agent
    -> merge
    -> converge
    -> 必要时追加 task
```

### 上游返工路径

```text
converge / QA
    -> 发现目标或设计问题
    -> 相关 Issue 标记 blocked
    -> rework impact assessment
    -> 仅对受影响层及其下游依赖执行 gate
    -> 同步 Issues
    -> 旧 assignments 标记 stale 或取消
    -> 重新调度
```

普通实现缺口不应无条件拉回 spec/plan；目标或技术设计已经变化时，也不应只追加一个 task 继续堆补丁。

## 7. 建议的外层 Workflow

逻辑上可组织为：

```text
specify
    -> clarify
    -> plan
    -> tasks
    -> analyze
    -> taskstoissues
    -> MAQA Coordinator
    -> Feature Agents
    -> QA Agents
    -> merge
    -> global converge
    -> 问题分类
```

分类后的分支：

```text
Converged
    -> final QA / human gate

实现缺口
    -> 追加 task
    -> MAQA 重新调度

task 拆分或依赖问题
    -> rework gate

plan 问题
    -> rework gate

spec 问题
    -> rework gate
```

## 8. 版本和失效策略

上游 spec 或 plan 修改后，不能让旧 Agent 无条件继续工作。建议引入以下机制：

```text
spec / plan 版本变化
    -> 记录版本或内容 hash
    -> 找出受影响的 tasks / Issues
    -> 标记旧 assignments stale
    -> 暂停或废弃受影响 worktree
    -> 重新生成任务上下文
    -> 重新派发
```

至少需要明确：

- 哪些文档变化会使任务失效
- 哪些 Agent 可以继续，哪些必须停止
- 旧 worktree 是否保留用于迁移
- 已有 commit 是否可以 cherry-pick
- Issue 描述和本地文档如何保持同步

## 9. 重要限制

- MAQA 是社区扩展，不是 Spec Kit 官方审计或背书的组件。
- MAQA 当前依赖 GitHub CLI、GitHub remote 和 GitHub Issues。
- worktree 隔离不等于没有合并冲突。
- 每个任务 QA 通过不代表整个 feature 满足全局验收条件。
- 上游文档修改会使正在运行的 Agent 产生旧上下文风险。
- Workflow 的 `shell` 步骤拥有本地用户权限，安装和运行第三方 Workflow 或扩展前必须审查源码。
- 不应把任意 Agent 输出直接插入 shell 命令。

## 10. 推荐落地顺序

1. 保留 Spec Kit 原生 `implement -> converge` 作为 feature 级收敛循环。
2. 用官方 Workflow 作为外层状态机，先编排现有阶段和人工 gate。
3. 用 MAQA 承担独立 task 的并行执行、worktree 隔离和局部 QA。
4. 用当前 rework gate 管理 spec、plan、tasks、checklists 的上游变更。
5. 明确 spec/plan 版本变化后的 assignment 失效和重新派发策略。
6. 接入 CI、架构检查和最终 acceptance evaluation。
7. 最后再根据实际瓶颈决定是否扩展自定义 Coordinator 或本地任务状态后端。

## 11. 一句话架构结论

```text
Goal-driven orchestration
    = 官方 Workflow
    + 任务 / Issue 图
    + MAQA 多 Agent 执行
    + QA / converge
    + 受控的上游 rework gate
```

官方 Workflow 决定流程如何运行，MAQA 决定多个 Agent 如何协作，`converge` 决定当前实现与目标的差距，当前 rework plugin 决定目标和设计发生变化时如何受控返工。

## 12. 参考资料

- Spec Kit Workflow: https://github.github.com/spec-kit/reference/workflows.html
- Spec Kit Reference Overview: https://github.github.com/spec-kit/reference/overview.html
- Spec Kit Community Extensions: https://github.com/github/spec-kit/blob/main/docs/community/extensions.md
- MAQA extension: https://github.com/GenieRobot/spec-kit-maqa-ext

# Implementation Plan: [FEATURE NAME]

## 1. 实现思路

整体准备怎么实现这个 spec。

包括：

- 主要模块
- 数据流
- 核心算法
- 关键技术选择

需要关联 spec 中的约束时引用其 ID，不重复定义 Contract。

## 2. 代码与模块结构

说明准备新增或修改哪些模块 / 文件，以及各自职责。

例如：

- `model.jl`：...
- `solver.jl`：...
- `io.jl`：...（含 checkpoint 落盘与断点续跑）

## 3. 数值与技术决策

记录实现 spec 所需、但不改变科学语义的技术选择，例如：

- 数值算法及实现方式
- 数据结构
- 数值表示 / 计算精度
- 并行方式（只选一层：外层网格并行 XOR 内层 BLAS/库并行；默认 BLAS 单线程 + 外层并行，须写选择理由）
- 落盘 / checkpoint 策略（分片粒度、落盘间隔、原子写、manifest 随片更新、断点续跑语义）
- CPU / GPU
- 关键依赖

说明选择理由和必要限制。

如果某项选择会改变实验定义、结果含义或 Contract，
则它不属于 plan，应返回 spec 明确定义。

## 4. 验证方案

说明 spec 中各项 Validation 如何落实。

按 spec 中的 `VAL-*` 引用，不重新定义验证标准。

例如：

- `VAL-001`：使用 reference solution comparison，
  由 `tests/...` / validation script 执行。
- `VAL-002`：在每个记录时刻检查对应 invariant。
- `VAL-003`：执行网格加密 convergence study。

包括适用时的：

- 单元测试
- 参考解比较
- 收敛 / 稳定性测试
- 数值一致性检查
- 分片合并一致性检查
- checkpoint / restart 一致性检查

## 5. 实现层未解决问题 / 延后工作（按需）

只记录不改变 spec、且不阻塞当前实现规划的问题。

- ...

如果问题涉及实验定义、科学参数、Contract 或 Validation 标准，
不得记录在这里，应返回 spec 处理。

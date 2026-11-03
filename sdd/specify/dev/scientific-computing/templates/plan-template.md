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

说明准备新增或修改哪些模块 / 文件，以及各自职责。路径遵循
`docs/README.md`；明确输入、`data/<feature>/` 数据输出与
`figs/<feature>/` 图片输出，不在根目录另放规划文档、状态页或字体。
涉及绘图时，记录 `scripts/figure_style.py`、字体环境与正式出图前的字体检查；
若项目提供 Times New Roman，四种字形固定放在
`assets/fonts/times-new-roman/`，由 helper 按文件注册并优先于系统同名字体，
不要求系统安装；记录原授权，不把 Noto 的许可证套用于这些字体。
四种 TTF 随 `scientific-computing` preset 提供，中文 OTF 与 LICENSE 随
`scientific-paper` 独立技能包提供；使用各自的 `scripts/install-fonts.sh`
安装到项目同名目录，内容冲突时停止。中文论文从 `assets/fonts/noto-serif-cjk/` 加载。

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
- 涉及文档迁移时的相对链接、固定目录与 LaTeX 字体路径检查
- 涉及正式出图时的实际字体、PDF 字体嵌入和最终有效字号检查

## 5. 实现层未解决问题 / 延后工作（按需）

只记录不改变 spec、且不阻塞当前实现规划的问题。

- ...

如果问题涉及实验定义、科学参数、Contract 或 Validation 标准，
不得记录在这里，应返回 spec 处理。

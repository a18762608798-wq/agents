# Feature: [名称]

> 本 spec 分为两部分：
>
> - **Part I — Scientific Description**：说明科学目标、实验 / 计算定义与输出，面向研究者阅读。
> - **Part II — Specification Contract**：定义边界、前置条件、结果条件、不变量与验证要求，作为可检查的规范性约束。
>
> 两部分必须一致；若存在冲突，应先澄清并修正 spec。

## Part I — Scientific Description

### 1. Objective

说明本 feature 要研究、验证或实现什么，包括适用时的：

- 核心科学问题；
- 计算目标；
- 希望回答的问题或验证的假设。

不要在这里写实现方案或验收细节。

### 2. Experiment / Computation Definition

以适合研究者阅读的方式描述足以确定实验语义的内容，包括适用时的：

- 系统 / 模型；
- 输入；
- 初始条件与边界条件；
- 参数及参数范围；
- 必要的数值设置；
- 实验 / 计算流程。

可以使用公式解释实验定义。对于已经在 Contract 中精确定义的约束，引用对应 ID，避免重复定义。

### 3. Outputs

说明需要产生、测量或分析什么，包括适用时的：

- 原始输出；
- observables；
- 派生量；
- 图表或统计量；
- 必要的结果记录信息。

本节说明输出的科学含义；精确的约束与验收条件写入 Part II。

### 4. Theory & References（按需）

记录理解本 feature 所需的引用，例如：

- `docs/theory/...`；
- 文献；
- 方程或模型来源；
- benchmark / reference data 来源。

复杂推导和背景应保留在 `docs/theory/`，不要复制到 spec。

### 5. Open Questions（按需）

- `OQ-001 [blocking]` ...
- `OQ-002 [non-blocking]` ...

阻塞性问题未解决时，不得进入依赖该问题的 plan / implementation。

---

## Part II — Specification Contract

本部分只记录具有规范性、可检查意义的约束。每条独立约束使用稳定 ID。

### A. Boundary

#### In Scope

- `BND-001` ...

#### Out of Scope

- `BND-002` ...

#### Dependencies

- `DEP-001` ...

### B. Notation（按需）

只定义本 feature 特有且理解 Contract 所必需的符号。

- `[symbol]`：...

### C. Preconditions

定义合法计算开始前必须成立的条件。

- `PRE-001` ...

### D. Postconditions

定义一次成功计算完成后必须成立的条件。

- `POST-001` ...

### E. Invariants

定义在指定计算区间或状态内始终必须成立的条件。

- `INV-001` ...

### F. Validation

定义如何判断结果满足本 spec。Validation 应引用其验证的 Contract ID，而不是重新定义对应约束。

包括适用时的：

- correctness / reference solution；
- convergence / stability；
- invariant checks；
- benchmark；
- invalid-run 判据。

- `VAL-001` → verifies `[POST/INV/PRE/...-ID]`: ...

---
name: scientific-experiment-map
description: Number paper data products with stable Dxx IDs and split a paper outline into numbered experiments. Use when the user mentions 实验拆分, 拆分实验, experiment map, expriment-map, 把大纲分到实验, 数据编号, 子图编号, 面板命名, 诊断图归属, or wants to assign paper-outline tasks into shared/exp experiments without designing experiment details.
---

# Experiment Map

把论文大纲（paper-outline）中的任务分到若干个实验，只定归属，不设计实验细节。

输入：大纲文件（如 `doc/paper-outline.md`）+ 理论目录（如 `doc/theory/`）。输出：实验拆分文件（如 `doc/experiment-map.md`，本仓库历史文件名为 `doc/expriment-map.md`，沿用既有命名不再改）。

输出文件是派生产物，不是口径来源。不要修改大纲、理论档、代码或实验数据，除非用户明确要求。

## 输出语言

默认中文。标题纯中文，技术术语保留英文原文（如 shared, exp, readout mitigation），因为与后续实验目录名对应。

## ID 约定（Dxx、Sxx 与 Exx 是三套坐标系）

- `Dxx` = 论文需要什么数据（需求侧，语义引用，不随章节重排而变）；`Exx`（`exp/shared`）= 怎么组织计算得到这些数据（生产侧）。
- 先给大纲中每个论文数据产品打 `[D01]`、`[D02]`…标签（含必要的论文层面参数区间，如 $s$ 范围、$L$ 取值；这是论文必要参数，不是实验配置）。
- 方法类、中间类产物（如目标比特、标定矩阵、shared 公共数据）本身不是 Dxx，只记消费与产出关系。
- `Sxx` = 中间数据（生产侧内部流转，如公共基态、最优参数、目标比特、标定矩阵），按出场顺序编号，只在实验节的依赖与产出中引用，不进 Data Products 表。
- 一个实验可产出多个 D（如 `exp02 → D02a–c + D03`），一个 D 可由多个实验共建（如 `D10 ← exp04 + exp06`）。
- 一张图一号，不许一对多：大纲条目下挂多张图的必须拆号。组图面板用母号 + 小写字母后缀（`D04a`–`D04d`，无下划线）；附录式并列图同样处理（`D02a`–`D02c`）。
- 三层各归各：`Dxx` 是数据产品层（Coverage 与 spec 只认这一层）；面板号是版式层（只出现在 outline 条目与文件名后缀）；文件是实现产物。同一数学对象经不同管线独立重算仍各占一号（如 `D01` 与 `D04d`，出处不同即不同产品），一致性由 verify 断言，不在大纲里标注。
- 编号冻结：一旦 mint 永不重排、永不重用。大纲调整（增删改图）只改条目排列，不动已有编号；删除的 Dxx 直接删行，不留墓碑（历史由 git 承担）；空位不填，新增图永远取下一个空号，不论它插在论文哪个位置。出场顺序只决定 outline 里的排列，不决定编号。

## 步骤

1. 清点并编号论文数据：人类写大纲时不会刻意给数据编号，所以这步由 skill 主动做。通读大纲，找出全部论文数据产品（含附录项、图注项），按正文出场顺序编 D01、D02…，向用户确认编号表后，把 `[Dxx]` 标签回写到大纲对应条目（一张图一号，多图条目按 ID 约定拆号）。方法类、中间类产物不编号；实验过程中看的诊断图不进大纲编号，由各 spec 以 `diag_` 前缀自行管理（非入库、不进 Coverage）。
2. 通读理论目录，理清任务间的数据依赖：谁生产公共数据，谁消费公共数据。
3. 识别公共数据并编号中间数据：被两个及以上任务使用的数据，立 `shared-xx` 实验；只被一个任务使用的数据（如读出标定矩阵），留在消费实验内部，不单独成实验。所有中间数据按出场顺序编 S01、S02…（含 shared 产出、实验间传递的参数与比特、实验自含的标定矩阵）。
4. 划分实验并编号：`shared-01…` 放公共数据（无对应正文图），`exp01…` 按正文出场顺序放任务。
5. 写拆分文件：顶部放 Data Products、Coverage、Intermediates 三张总表；每实验只写依赖与产出，论文结果引 Dxx，中间数据引 Sxx，不写“第几节第几项”这类位置引用，不写中文数据名。

## 负规则（只定归属，不做设计）

- 不写任何实验细节：不写参数、网格、shots、拟合方法、画图方案。
- 纯图注工作（如在相图上标起点、拟设示意图）不单独成实验，随出图实验注明。
- 不推断大纲之外的任务；大纲没写的实验不许编。
- 诊断图（纯模拟 / 纯真机分开视图等过程用图）不进大纲、不进拆分文件，由各 spec 输出节以 `diag_` 前缀定义；拆分文件只收 Dxx / Sxx。
- 不改输入文件，唯一例外是经用户确认后的 Dxx 标签回写；除此之外拆分文件只增量更新归属。

## 输出模板

```markdown
# expriment-map

按 paper-outline.md 拆分实验, 只列任务归属, 不含实验细节. Dxx 为论文数据产品, exp/shared 为实验组织.

## Data Products

| ID | 数据 |
|---|---|
| D01 | ... |

## Coverage

| 数据 | 生产实验 |
|---|---|
| D01 | exp01 |

## Intermediates

| ID | 数据 |
|---|---|
| S01 | ... |

## shared-01 XXX公共数据

产出: S01, S02 供 expXX 消费.

## exp01 XXX

依赖: S01. 产出: D01.
```

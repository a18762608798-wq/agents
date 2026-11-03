# Constitution

## I. Spec 是实验定义的权威来源

任何影响实验语义、结果解释或可重复性的条件，都必须由对应
feature 的 spec 明确定义。

实现不得静默改变实验语义。
实验定义发生变化时，应先更新 spec。

Spec 是持续维护的活文档，而不是一次性交付物。

## II. 实验笔记、实验规范与论文分离

- `docs/experiment-notes/`：为 Exp 实现服务的模型、公式、符号与计算约定，
  允许简写和省略背景
- `spec.md`：实验或计算任务的定义
- `plan.md`：实现方案与技术决策
- `tasks.md`：具体实现工作
- `docs/planning/paper-outline.md`：唯一论文大纲
- `docs/paper/`：正式论文正文与参考文献

实验笔记与 spec 必须保持科学约定一致；不在 spec 重复推导，
也不将无必要的实现细节写入 spec。

正式论文理论必须先通过文献技能检索并阅读全文，核验来源对具体论述的
支撑与适用条件，再独立组织定义、前提与推导，并与 Exp 约定核对。
必须区分文献结论与项目自己的构造；已有正确公式可保留，
不得将笔记中的简写直接视为完整论证，也不得因补引文而改变实验含义。

Paper 按任务使用独立 skills，直接维护论文大纲和正文；
不创建 Paper spec、plan、tasks、paper-map 或 paper feature。

固定目录约定由 `docs/README.md` 维护：规划文档放 `docs/planning/`
（`paper-outline.md`、`experiment-map.md`），派生看板放 `docs/status/`
（`paper.html`、`experiments.html`），中文论文字体及许可证放
`assets/fonts/noto-serif-cjk/`。项目提供的 Times New Roman 四种字形放在
`assets/fonts/times-new-roman/`，由绘图 helper 按文件注册并保留原授权说明；
字体文件随 `scientific-computing` preset 保存，由其 `scripts/install-fonts.sh`
安装到项目目录。`docs/experiment-notes/`、`docs/paper/`、
`specs/`、`figs/` 各守原有职责，不在根目录另建副本。

## III. Feature 边界必须清晰

- 每个 feature 应拥有明确且尽量独立的职责。
- 不同 feature 不应重复定义同一实验流程或基础能力。
- 多个 feature 共用的能力应抽取为共享 capability，而不是重复实现。

已有 feature 按影响增量维护；日常工作方式由项目 `AGENTS.md` 约定。
新建或实质重设计实验走完整 Spec Kit 流程；整体对齐按需使用 analyze/converge，
检查须覆盖跨实验依赖并区分已验证与未核验项。

## IV. 实验必须可重复和可追溯

- 影响结果的参数、输入、随机性、数值设置及必要运行信息必须能够被记录和恢复。
- 不得依赖影响结果但未被记录的隐式条件。
- 长时计算必须增量落盘、可中断恢复；禁止全量驻内存 + 单文件收尾。

## V. 科学正确性优先于性能

- 优化、重构或并行化不得静默改变科学结果的含义；并行化不得引入嵌套 oversubscription。
- 任何可能改变数值行为的修改都必须重新验证正确性。

## VI. Spec 必须清晰且可验证

- Spec 应区分面向研究者的科学描述与具有规范性的约束，并保持两者一致。
- 规范性约束应采用足以消除歧义、支持验证的最低必要形式化程度。
- 数学性质优先使用数学表达；行为性质可使用受控自然语言。
- 不得用多个彼此独立的表述重复定义同一规范性约束。

## VII. 项目技术与风格约定

| 域 | Skill |
| --- | --- |
| 研究型计算（仿真 / 参数扫描 / 论文复现） | `scientific-research-computing` |
| 可复用 Julia 包 / 库开发 | `scientific-package-development` |
| 运行环境 | `scientific-project-environment` |
| 出图风格 | `scientific-figure-style` |
| 论文写作、引用、排版与评审 | 按任务使用独立 `paper-*` skills |

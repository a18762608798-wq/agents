---
name: paper-assembly
description: 按用户当前需要协调已有论文大纲、Exp 产物和独立 Paper skills，检查缺件并推进成文、引文、排版或评审。适用于整篇论文整理和跨章节协调；不创建 Paper spec/plan/tasks 或 Paper feature，也不自动开展实验。
---

# Paper Assembly

这是可选的协调入口，各 paper-* skills 也可以单独使用。
先读 ../paper-writing-section/references/writing-policy.md。

## 上下文与边界

读取项目 docs/README.md、唯一的 docs/planning/paper-outline.md、现有稿件，
以及相关 experiment-map、Exp spec、结果和图。实验笔记只用于理解实际计算约定。
不创建 paper-map、paper-XX、另一份论文大纲或强制阶段检查点。

## 推进当前工作

1. 根据用户要求和现有稿件，识别这一轮要完成的章节、引用、格式或评审工作。
2. 对缺件区分：实验数据/图缺失、文献或理论尚未核验、解释尚不能由证据支持。
   明确影响到哪些段落；缺件不阻止无关内容继续写作。
   文献证据缺口更新对应的来源条目，其他缺件在本轮回复中说明，不自动创建论文总工作日志；
   科学限定在稿件对应位置说明，不转写成反复防御性评价。
3. 理论或背景成文前，安排 paper-gamma-hunter 做文献发现与全文核验；
   然后由 paper-writing-section 组织论证并核对 Exp 约定。
4. 按需调用 paper-figure-layout 和 paper-latex-formatting；
   从真实产物读取图表，不让 Paper 技能自行制造实验结果。
5. 用户要求评审或当前交付确有需要时，使用 paper-self-review 和 paper-revision。
   编译直接使用项目已配置工具；不要求调用不存在的编译 skill。
   措辞修改默认检查 TeX 并编译，不自动追加本稿 PDF 审阅。
6. 报告本轮实际完成项、证据位置和仍未解决的缺件。
   不以“文件存在”或固定阶段计数证明论文已完成。

章节顺序、段落和主附录组织可以迭代；只有主线或核心主张变化时才维护大纲。
新的计算、测量或结果含义变化，整理为 Exp 层待处理事项，不在本技能中执行。

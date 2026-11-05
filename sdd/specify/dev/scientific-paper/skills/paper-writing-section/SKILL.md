---
name: paper-writing-section
description: 撰写或修改论文的 Abstract、Introduction、理论背景、Methods、Results、Discussion 和 Conclusion。依据论文大纲、Exp 产物和已核验文献组织正文；理论成文前先核实来源、假设与项目约定。Related Work 按主题比较。无需 Paper spec、plan、tasks 或 Paper feature。
---

# Paper Section Writer

按用户指定的章节或段落直接修改论文稿件。先读 references/writing-policy.md。

## 输入与上下文

接受章节名称、写作要求、现有稿件、论文大纲或理论问题；正文尚不存在时也能开始。
读取项目 docs/README.md、docs/planning/paper-outline.md、相关 Exp spec 与真实结果。
实验笔记记录模型、符号、公式和计算约定，是理解实验的输入，不是可以直接搬用的论文稿。

## 写作前的理论与文献准备

1. 列出这一节需要解释的概念、理论结论、方法来源和适用假设。
2. 缺少参考文献时调用 paper-zotero-hunter；发现候选走 zotero-paper-hunter。
   在相关技术段落成文之前，读取全文并确认它支持计划表述，而非写完后补装饰性引用。
3. 依已核验来源独立组织定义、解释与必要推导，核对符号、归一化、边界条件和实验实现。
   正确公式可以保留；重写的目标是补足依据与论证，不是机械更换符号。
4. 区分文献已有结论与本项目的构造、假设、近似和推导。项目特有公式不能仅凭相近文献获得背书。
5. 理论与实验不一致时，暂停受影响段落，指出需要在 Exp 层核实的问题；不静默修改实验定义。

## 写作与修订

- 章节范围和论证主线服从现有论文大纲；一般改写直接改正文。
- 保留有信息量的科学限定，去除重复防御性措辞；按 writing-policy 判断，不按否定词批量删句。
- 不设自我限制句配额；结果更新时核对摘要、引言、结论和图注中的旧表述。
- 按需读取 references/section-tips.md，不强制每段加计划注释。
- Related Work 读取 references/related-work-prompts.md，按主题比较方法、结论与本文位置。
- PRA/APS 稿件按需读取 ../paper-latex-formatting/references/pra-writing-style.md。
- 使用 references/refinement-prompts.md 做准确性和简洁性检查。
- 文献核验后即可在写作中绑定引用；修改了被引用陈述的范围时，重新检查支撑关系。
- 缺失数据或未核验理论明确留待办或暂缓相关段落；允许继续处理不依赖该缺件的内容。
- 只在主线、核心主张或数据需求变化时更新大纲；保持已有 Dxx/Sxx 编号。

## 输出与检查

输出项目指定的 LaTeX 章节或修订后的正文，遵守项目公式与 venue 排版约定。
检查实验数字的来源、定义和假设、文献支撑位置、符号等价关系以及图文一致性。
检查引用和交叉引用；待办必须与最终可提交状态明确区分。
新增来源或被引论述范围变化时更新对应的核验条目；没有文献支撑变化的措辞或排版修改不更新引用记录。
措辞修改默认以 TeX 核对和编译完成验证；本稿 PDF 检查按共同 writing-policy 按需进行。

按需使用 paper-zotero-hunter、paper-figure-layout、paper-latex-formatting、
paper-self-review 和 paper-revision；编译由 agent 直接执行。

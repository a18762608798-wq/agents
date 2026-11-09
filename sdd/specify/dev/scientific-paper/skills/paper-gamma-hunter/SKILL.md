---
name: paper-gamma-hunter
description: 从论文大纲、拟写章节、理论问题或已有草稿出发，协调 Gamma 文献发现、全文核验与引用绑定。支持正文尚不存在时先核实理论依据；只有已读确认支持具体表述的来源才能写入引文。
---

# Paper Gamma Hunter

先读 [共同写作规则](../paper-writing-section/references/writing-policy.md)。
接受 harvest、verify、bind、validate、format 操作，也接受直接描述的文献或理论需求。
输入可以是论文大纲、计划论述、实验笔记、LaTeX/BibTeX 文件或用户的问题；不要求 Paper spec 或草稿已存在。

## 连接、目标与入库

- 阅读 [Gamma 文献库约定](references/gamma-library.md)，优先读取项目 `docs/paper/library.json` 的工作区和目录绑定，以及可选 `gamma-page-map.json` 的既有 cite key 与 Page 映射；它们是技能输入，不会自动替 MCP 选择工作区。
- 先发现 Gamma MCP 并调用 `list_workspaces`，核对配置中的工作区仍被授权。所有后续 scoped 调用显式传 `workspace_id`；不回退到 admin，也不因另一个工作区有同名目录就改目标。
- 用 `list_folders` / `list_pages` 核实目录，跟随分页。只检索已有文献时用 Gamma `search_library`、`list_pages(title_contains=...)`，再用 `read_page` / `cite` 核对；搜索是字面匹配，不是语义检索。
- 查缺和找论文使用 `gamma-paper-hunter`；找书、教材、讲义使用 `gamma-book-hunter`。传递已确认的工作区和目录；遵循它们的去重、全文获取、原生属性与标签约定。
- 文献操作统一经 Gamma MCP；必要能力不可用时报告具体缺口，暂停依赖它的入库和核验。
- 已有 Page 与 PDF 复用；同一 Page 可归入多个目录，目录归属无主次。候选通常进入配置中的 `paper_inbox`，书籍进入 `book_folder`。仅需引用既有 Page 时按工作区与 Page ID 定位，不必重新归档。
- 需要调整归档时，按当前 `move_page` 工具的目录上下文语义执行，并复核目标目录及应保留的归属。未经本次任务要求，不改已有 Page 的归档、元数据、标签和批注。

## harvest：从问题或计划论述发现候选

1. 读取拟写的理论、背景或方法内容，形成具体引用需求；正文不存在时使用大纲或计划论述。
2. 区分已知定义的来源、方法出处、与本工作比较和项目自行推导，先查项目目录，再在目标工作区判重。
3. 对缺失来源调用对应 Gamma hunter，得到真实的工作区 ID、Page ID、元数据与全文状态。
4. 列出拟支撑论述和章节；需跟进的候选在已有核验记录中标为待核验，不绑定正文引用，不追加检索过程日志。

`scripts/harvest_citations.py --dry-run` 可辅助从已有英文 TeX 起草检索问题。
该旧辅助脚本的外部候选/BibTeX 输出不能代替 Gamma hunter 的核实、去重和入库，也不能直接合入正式 bibliography。

## verify：经 Gamma 阅读全文，核实支撑关系

1. `read_page` 获取原生元数据、笔记和 PDF 文本，核对文献与所读版本。用 `cite` 取引用记录；必要时 `inspect_pdf_pages` 核查附件。
2. 用 `pdf_page`、`pdf_chars` 和返回的 `pdf_offset` 继续阅读相关定义、定理、方法或公式。不能只读摘要；页图或文本不足时按需用 `view_pdf_page`。
3. 核对前提、适用范围、记号、归一化、边界条件及与项目实验的差异；区分用户笔记、PDF 正文和 AI 聊天记录。
   对拟在正文首次出现的非通用概念，读清原文定义并提供简明释义；记号不同须给出与本文约定的对应关系，核对参数、正负号和常数因子，不能以引用代替定义。
4. 给出“确认支持”“仅支持部分范围”“不支持”或“待核验”的结论，按来源更新已有引用索引。
5. 保存项目 cite key、`workspace_id`、Gamma Page ID/绝对链接、所读版本、页/节/公式定位、支撑论述、适用条件及正文或计划绑定位置。
   PDF 物理页码与印刷页码分别说明；段落链接只使用实际读到的原文和页码。
6. 整理已有记录时保留有效阅读证据；核对条目身份不等于重新完成全文核验，未映射条目标明缺口。

没有可读全文时，只能确认元数据事实，不能确认技术内容。
文献没有直接给出本项目公式时，说明自己的推导及其基础，不让相近关键词充当证明。
核验状态在项目索引维护，不另造 Gamma 标签，也不把自动元数据标记当作人工确认。
记录边界遵循 writing-policy，不追加改稿、编译或实验验收台账。

## bind：写入已经核验的引用

- 依据实际正文再次确认支撑范围；正文尚未写成时将证据交给写作 skill。
- 用 `cite(page_ids=[...], workspace_id=...)` 获取 Gamma 原生字段与 BibTeX，每次最多 50 个 Page。
- 先按 DOI、arXiv 身份或可靠书籍元数据判重，保留项目已有正确 cite key。Gamma 默认 key 可能重名或不同于项目 key；本地合并时保留字段，只映射条目 key，不用整批导出覆盖正式 `references.bib`。
- 已有核实字段不因 Gamma 缺字段而被删除。需补原生属性时先 `read_page`，按对应 Gamma hunter 的规则传 `expected_meta`；无明确需求不更改工作区级 cite key。
- 在准确位置绑定引用，将影响论断的假设和适用范围写入相关定义或方法；表述实质改变后重新核验。
- bibliography 和核验记录沿用项目配置的路径，通常为 `docs/paper/references.bib` 与已有引用索引。

## validate / format

按项目解释器运行 `scripts/validate_citations.py`，检查 key、重复项和交叉引用。
脚本的 `--tex` 仅检查该文件；多文件论文需提供展开输入后的文本，或按每种语言单独收集所包含的 TeX 到隔离目录后用 `--tex-dir` 检查，避免漏掉章节或混入中英文重复标签。
需要时核对真实图路径。格式通过不证明文献支撑关系；占位条目不能进入可提交稿。
格式调整保持身份和合法 keys，不生成虚构字段。

## 输出

给出目标工作区/目录、本轮引用需求、复用或新增的 Page、核验结论、证据位置、正文绑定与未完成缺口。

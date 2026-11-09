---
name: gamma-book-hunter
description: 找教材、专著或讲义并去重入库 Gamma。用户明确要求给 Gamma 加书、导入教材、按书名或 ISBN 找书时使用；先核实版本和 ISBN，再经 Gamma MCP 保存 PDF、原生书籍属性和标签。只在库内检索不走 hunter；找论文走 gamma-paper-hunter。
---

# Gamma 书籍猎手

只处理用户点名的书和讲义，不主动扩写书单。结果进入指定 Gamma 工作区的主题 `book` 目录，书籍信息保存在原生文献属性中。

## 连接与目标

- 先发现 Gamma MCP，用 `list_workspaces` 获取本连接已授权的工作区，再调用 `list_pages`、`list_folders` 查看目标目录。一个连接可授权多个工作区，所有后续调用都显式传目标 `workspace_id`；不假定是 admin，不以浏览器当前页面猜目标，确实无法判断时再问用户。
- 阅读 [MCP 入库约定](references/mcp-ingest.md)，按实际 schema 调用。缺少本次必需的元数据或 PDF 写入能力时先补 MCP；不以浏览器填表、HTTP 接口、容器复制或数据库写入绕过。
- 优先沿用 `<研究根>/<主题>/book`，没有研究根时用 `<主题>/book`。目录不存在可由 `save_paper` 或新 Page 的 `move_page` 创建。

## 核实版本与判重

1. 用户只给书名，也要先查出版社页的作者、版本、出版年、出版社、ISBN。区分纸本与电子版 ISBN、不同版次和译本；ISBN 要与取得的实际版本一致，不能编造。没有 ISBN 的讲义如实留空。
2. 用 `list_pages(folder=...)`、全工作区 `list_pages(title_contains=...)` / `search_library(query=...)` 查书名和作者，跟随分页；Gamma 的搜索是字面检索，不能当语义搜索。
3. 对可能重复的 Page 用 `read_page` / `cite` 核对 ISBN 和版本。ISBN 优先，缺 ISBN 时用标题、作者、年份和版本综合判断。相同版本仅有元数据也算已有；不同版次保留为不同作品，不自动替换旧版。

## 获取文件

优先作者官网或出版社公开版，其次用户提供的本地文件；用户指定来源时遵从。静态信息优先官方页/API，动态页面按当前会话浏览器规则处理。需要 `agent-browser` 时先加载其 skill、检查环境，优先系统 Chrome，使用本任务独立会话与当前 Linux 用户的资料目录。网络确有问题时按 `env-proxy` skill 诊断，保留用户后台代理设置。

没有公开全文时，可尝试其他来源（如用户指定的 Z-Library）；只处理点名的书，失败则保留准确条目并注明缺全文。讲义若分章发布，保留章节与整部作品的关系，不把一章冒充整本，也不为导入而破坏 PDF 的可读性。

每个本地文件先验为真实 PDF，读前 3 页核对标题、作者、版本和 ISBN；扫描件可看页图。标题或版本不对应就不用；预览、节选和整本必须明确区分。

## 经 MCP 入库与补属性

- 已有完整的同版本书：复用原 Page；不另建重复条目，不覆盖人工确认信息。
- 有公开页面或 PDF URL：`save_paper(source=url, title=书名, folder=目标路径)` 可用于书籍；虽名为 paper，它复用通用 URL 导入。它不是 ISBN 查询工具，不能把 ISBN 当 DOI 传入。检查实际 `pdf` 结果，用 `read_page` / `inspect_pdf_pages` 验证导入文件。
- 只有本地 PDF：`import_pdf_page` 上传真实字节。已有且无 PDF 的 Page 传 `page_id` 直接补附件；新 Page 用 `move_page` 归档。单次 base64、既有 PDF 和大文件边界见 MCP 约定，不用 UI 绕过。
- 只有元数据：复用已有 Page，或用来源 URL `save_paper`；没有可用 URL 才用 `create_page`。有多个讲义章节时，可建立作品 Page，再用 `import_pdf_page(parent_page_id=作品Page)` 建 PDF 子页；在报告中列明。
- `update_page_metadata` 写入核实后的原生字段：`title`、`authors` 数组、`year` 字符串、`publisher`、`isbn`，以及真实存在的 `doi`。正式书选 `kind="book"`，书章选 `bookSection`，非出版讲义通常选 `document`；不要用虚构的 `textbook` 类型。
- 每次编辑前 `read_page`，传 `expected_meta` 防止覆盖并发修改；只补本次核实的字段。Gamma 当前没有独立 edition 字段；版本可在 Page 标题和简短来源笔记中注明，不能伪造 metadata 字段。
- 结构化信息必须写进“论文元数据”原生属性（该编辑器也支持书），不要另造普通笔记代替。笔记仅补充版本、来源链接、章节关系和使用说明。
- `label_page` 增量加标签：正式书 `textbook`，讲义 `textbook`、`lecture-notes`；保留原标签。自动写入的记录由 MCP 标为未人工核验，不冒充人工确认。
- 超时或响应丢失时先检索核实，确定未写入才重试。

## 收尾

用 `read_page`、`cite` 核实标题、作者、出版社、年份、ISBN、原生类型和生成的 BibTeX；检查目录、标签和 PDF 身份。未取得或未能导入全文要如实报告，不把有 URL 当作有 PDF。

报告目标工作区/目录、新增、已有、补全文和失败的数量；逐本给书名、版本、ISBN、Gamma 的绝对链接及“整本 PDF/章节/预览/仅条目”，并说明未完成原因。无需调用旧文献库索引工具，也不向旧文献库写入。

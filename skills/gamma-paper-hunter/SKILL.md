---
name: gamma-paper-hunter
description: 按研究任务查缺、找论文、获取全文并去重入库 Gamma。当用户明确要求给 Gamma 搜论文、配参考文献或导入指定论文时使用；经 Gamma MCP 归档到主题 paper/inbox，填写原生文献属性。只检索 Gamma 已有文献不走 hunter；书籍和讲义走 gamma-book-hunter。
---

# Gamma 论文猎手

把与任务相关、核实过身份的论文加入用户指定的 Gamma 工作区。默认最多新增 3 篇；用户指定数量时遵从。先盘点已有文献，再补缺，够数即停。

## 连接与目标

- 通过当前会话工具发现机制查找 Gamma MCP。先 `list_workspaces` 获取已授权工作区的 ID、名称和权限，再用 `list_pages`、`list_folders` 查看目标目录；不假定是 admin，不硬编码工作区 ID。一个连接可授权多个工作区，每次后续调用都显式传目标 `workspace_id`；多个候选无法判断用户意图时再问，不以当前浏览器页面猜目标。
- 读取 [MCP 入库约定](references/mcp-ingest.md)，核对当前实际工具 schema。必须有 `update_page_metadata`，以及本次需要的 `save_paper` / `import_pdf_page`。缺少必要能力时先补齐 MCP；工具没加载先发现，不改配置、不直读库、不用浏览器或 HTTP 接口代写。
- 复用主题目录，默认 `<研究根>/<主题>/paper/inbox`；没有研究根时用 `<主题>/paper/inbox`。`save_paper` 或 `move_page` 可按路径创建目录。明确记录目标路径和返回的 Page ID。

## 查缺与发现

1. 用 `list_pages(folder=...)` 看目标主题，配合 `search_library(query=...)` 和 `list_pages(title_contains=...)` 做全工作区短关键词检索。Gamma 当前搜索是字面检索，不能当语义搜索。跟随分页，不用一次空结果断言不存在。
2. 对候选调用 `read_page` / `cite` 核对完整记录。判重先 DOI，再去版本号的 arXiv ID，再归一化标题加作者；出版版与预印本核对对应关系，不把不同论文合并。仅有元数据、无 PDF 的 Page 也属于已有条目。
3. 优先从 arXiv、OpenAlex 等学术 API 发现候选；API 不可用时用会话提供的网页搜索。最新进展偏向 arXiv，引用关系可参考 OpenAlex；搜索热度不等于相关性。只保留对任务有明确用途的论文。
4. 在 arXiv 摘要页、出版商页或 DOI 记录核实标题、作者、年份、出版物和标识符；搜索摘要不能代替核实。尊重服务限流，arXiv API 请求至少间隔 3 秒；遇限流退避，Scholar 仅作补充。

## 获取全文

按以下顺序逐篇处理，来源由用户指定时遵从其选择：

1. 出版商开放获取、arXiv、作者公开稿或机构仓储。可先下载到本任务独立临时目录，检查文件类型并读前 3 页，确认标题、作者、DOI 对应目标；不要把 HTML 验证页当 PDF。
2. 无开放全文时，使用 [海南大学 APS 订阅下载](references/campus-access.md)。后台代理开启不等于校园请求要走代理。当前可复用的下载器仅支持 APS，不把其他出版商当作已支持。
3. 无 OA、订阅未成功时，可尝试 sci-hub 补充来源；只做本次所需的低量尝试，遇访问限制按当前会话浏览器规则处理，失败保留准确元数据条目并注明无全文。不要把失败解释为“学校无订阅”。

需要网页交互时遵循当前会话的浏览器工具规则；允许使用 `agent-browser` 时先加载其 skill，检查运行环境，使用独立命名会话。优先系统 `google-chrome`，每个 Linux 用户保留自己的资料目录，不接管别人的浏览器。

## 经 MCP 入库与补属性

- 已有且有正确 PDF：返回原 Page；不重复导入、不覆盖人工核实记录。用户要求补全时仅补缺失字段。
- 新论文、服务器可取的公开 DOI/arXiv/URL：用 `save_paper(source, title, folder)`。检查返回的 `pdf`，并用 `read_page` / `inspect_pdf_pages` 核实服务器实际保存的 PDF；`pdf=false` 只代表保存了网页条目。
- 已下载的正确 PDF：用 `import_pdf_page` 传真实字节的 base64；若已有无 PDF 的条目，传它的 `page_id`，保留原条目。新 Page 再用 `move_page` 归入目标目录。大文件与现有 PDF 的处理边界见 MCP 约定。
- 所有全文来源失败：用 `save_paper` 保留来源 URL；若已有元数据条目则复用。只有没有可用来源 URL 时才 `create_page` 创建文献 Page。
- 用 `update_page_metadata` 写原生字段：`title`、`authors` 数组、`year` 字符串、`venue`、`volume`、`pages`、`doi`、`arxiv_id`、`kind`。类型按实际选 `journalArticle`、`conferencePaper`、`preprint` 等。未知字段不猜，部分更新省略未改字段，传刚读到的 `expected_meta`。
- 元数据属于 Gamma 的“论文元数据”属性；不要另建一份普通笔记充当结构化字段。可用 `create_block` 补充选文理由、来源链接及版本说明；先检查已有笔记，避免重试重复。
- 新 Page 或本次新补全文的 Page 用 `label_page(add=["agent-crawled","unreviewed"])` 增量标记，不移除原标签，不把自动写入伪装成人工核验。
- 写入超时或回复丢失时，先搜索和读取确认结果，再决定重试；不盲目创建第二份。

## 核验与报告

最后 `read_page`、`cite` 核对原生元数据、BibTeX、目录和标签；有 PDF 时核对正文身份及服务器文件状态，不能只看调用成功。若误导入错误 PDF，停止向该 Page 填目标元数据，报告具体 Page；清理仅处理本任务明确新建的错误条目，并使用 MCP 的回收站删除。

报告目标工作区/目录、新增数、已有数、失败数。逐篇给标题、作者、年份、DOI/arXiv、Gamma 返回的绝对链接，以及“有 PDF（来源）/仅条目/待补全文”。区分真正新增、复用已有和本次补全文；列出没有完成的具体原因。

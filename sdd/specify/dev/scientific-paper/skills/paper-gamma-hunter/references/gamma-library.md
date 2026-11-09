# Gamma 文献库绑定与身份

`paper-gamma-hunter` 处理论文中的支撑关系；全局 `gamma-paper-hunter` /
`gamma-book-hunter` 负责找文献、取全文并入库。库内检索和已有来源核验直接使用 Gamma MCP。
通过会话技能发现机制加载这些依赖；缺失时报告具体能力缺口。

## 项目绑定

优先读取 `docs/paper/library.json`，再用 `list_workspaces` 和 `list_folders` 校验。
无配置时依据用户明确指定的工作区/目录解析；确实有歧义才询问，明确后可保存绑定。
此文件不含令牌，也不授予权限；每次 MCP 调用仍需显式传目标 `workspace_id`。
项目若维护 `docs/paper/gamma-page-map.json`，优先按其中的 cite key → Page 映射定位；记录工作区、Page ID/链接与文献身份，未映射条目标明缺口。

示例结构（ID 必须使用 MCP 的真实返回值；路径相对项目根目录）：

```json
{
  "schema_version": 1,
  "provider": "gamma",
  "workspace_id": "<已授权工作区ID>",
  "workspace_name": "<工作区名称>",
  "root_folder_id": "<既有项目目录ID>",
  "root_folder_path": "<主题根>",
  "paper_inbox": "<主题根>/paper/inbox",
  "book_folder": "<主题根>/book",
  "bibliography": "docs/paper/references.bib",
  "verification_index": "docs/paper/citation-verification.md",
  "page_map": "docs/paper/gamma-page-map.json"
}
```

已有文献可能直接在主题根；搜索时包括其子目录。inbox/book 是新增内容的目标路径，
不要求为了完成只读检查建立空目录。ID 与路径不一致时先核对重命名或移动，不能选一个静默覆盖。
项目绑定不会同步到全局 hunter 配置；调用时传递这一上下文。
目录用于组织文献，同一 Page 可有多个目录归属且无主次；上述目录绑定是项目检索与新增入库的目标，不给 Page 指定主目录。共享文献复用已有 Page 与 PDF，引用身份由工作区与 Page ID 确定。

## 读取与引用

- `list_pages(folder=..., limit=..., after=...)` 列出候选；`search_library(query=...)` 做字面检索。结合标题和标识符，空结果不证明不存在。
- `read_page(page_id=..., pdf_page=..., pdf_chars=..., pdf_offset=...)` 阅读全文窗口；缺少 PDF 就如实记录，不把笔记/聊天当全文。
- `read_page` 的 `structuredContent.metadata` 返回 `meta`、`bibtex`、`cite_key`；`cite` 返回页面的原生引用（最多 50 个 Page）。
- Page 的完整身份是工作区与 Page ID。索引使用 MCP 返回的绝对链接；物理 PDF 页码来自结果中的 `[PDF page N]`，印刷页码另记。
- 本地项目 key 可以与 Gamma 默认 key 不同。同作者同年可能发生默认 key 冲突，按文献身份映射到现有 key 后合并，保留已有完整字段与 LaTeX 转义。
- 如需写回元数据，使用 `update_page_metadata` 与最近读取的 `expected_meta`。核验记录不要求更改 Gamma 自动核验标记或全局 cite key。

## 校验已有引用映射

按 DOI 优先、arXiv 身份其次、可靠标题/作者/版本补充确认对应关系。
索引使用工作区、Gamma Page ID/链接及项目 cite key 定位来源。
保持已有 cite keys、所读版本、阅读定位和证据缺口；不把身份匹配升级为重新阅读全文。
目标工作区不存在的条目标明未匹配，不编造 Page ID。
只在本次要求包含补全文/新入库时调用对应 hunter；未匹配来源不影响已有来源的核验和写作。

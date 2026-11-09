# Gamma MCP 原生入库约定

只调用当前会话实际发现的 Gamma MCP 工具；下列为未加连接前缀的工具名。后端支持不等于会话已加载；缺失时先发现，必要时报告需要刷新连接。读取连接不授予写入，`/mcp-write` 的授权工作区才可写。不要自行修改 MCP 配置或复制令牌。

## 多工作区

- 先 `list_workspaces()`，仅返回此连接明确授权且仍可访问的工作区，含 `id`、`name`、`role`、`can_write`。
- 其余工具均支持顶层 `workspace_id`。本 skill 每次都显式传用户选定的目标 ID；一个连接授权多个工作区时，缺少它会被拒绝，不存在跨请求保存的“当前工作区”。本文下方的简写调用也要带上这个参数。
- `read_gamma_link` 可从 URL 中的 `ws` 或共享令牌前缀确定已授权目标；与显式 `workspace_id` 冲突时拒绝。不能通过 URL、Page ID 或公开共享设置增加授权范围。
- 后续工具的 `structuredContent.workspace_id` 和返回的绝对链接应与目标一致。不同工作区的数据分别检索、判重和入库；不能拿另一工作区的 `stored_doc_id` 直接复用文件。
- 老授权仍仅覆盖原工作区；用户需在新授权页勾选多个工作区一次，不能自行扩权。之后切换调用目标无需重新登录。

## 读、判重与属性

- `list_pages`：支持 `folder`、`title_contains`、`parent`、`label`、`limit`、`after`。不是全文语义检索。
- `search_library(query, limit)`：字面关键词检索。只搜 DOI/ISBN 可能漏报，结合标题查询。
- `read_page(page_id)`：正文、笔记和属性摘要；`structuredContent.metadata` 返回原生 `meta`、`bibtex`、`cite_key`。无元数据时 `meta={}`。`cite(page_ids=[...])` 最多 50 个 Page，返回原生引用。
- `update_page_metadata(page_id, meta, expected_meta?, cite_key?)`：增量修改原生 `properties.meta`，保留省略字段与其他属性，重建 BibTeX，清除旧缓存引用；不联网检索元数据、不重命名 Page。`expected_meta` 必须是最近 `read_page` 返回的完整 `metadata.meta`；并发变更拒绝后重读。
- `meta` 仅允许 `title`、`authors`（字符串数组）、`year`（字符串）、`venue`、`volume`、`pages`、`doi`、`arxiv_id`、`publisher`、`isbn`、`kind`。空字符串/空数组清相应字段；不要发送不打算清除的空字段。`cite_key` 省略保留原 pin，空字符串取消 pin。空 `meta={}` 不是“清空全部”。
- `kind`：`journalArticle`、`conferencePaper`、`preprint`、`bookSection`、`book`、`thesis`、`report`、`presentation`、`document`。无独立 edition 字段。MCP 实际修改会标记 `source=mcp, unverified=true`，不能传 `user_verified` 冒充人工确认。

```json
{"workspace_id":"<list_workspaces返回的目标ID>","page_id":"<真实返回的Page ID>","expected_meta":{},"meta":{"title":"<核实后的书名>","authors":["<作者姓名>"],"year":"2025","publisher":"<出版社>","kind":"book"}}
```

## PDF 与网页来源

- `save_paper(source, title?, folder?)`：原生 DOI/arXiv/HTTP(S) URL 导入，服务器取可达 PDF，保存失败时可能仅有网页条目。返回 `page_id`、`existed`、`pdf`，必须保留 `false` 的含义。此 MCP 调用不会异步查元数据，随后显式写入原生属性。
- 它按附件 DOI/arXiv/URL 去重，纯网页条目按来源 URL 去重；人工创建的无附件元数据 Page 不保证被自动识别，先做标题/标识符判重。新旧版本和来源改变也要核对。
- `import_pdf_page(title, filename, pdf_base64或stored_doc_id, page_id?或parent_page_id?)`：base64 原始 PDF 最大 **16 MiB**；`stored_doc_id` 只能复用该工作区已经存在的文件（由 `inspect_pdf_pages` 返回），不受这次上传字节上限限制。`filename` 只是显示名称，不是文件路径。
- `page_id`：补附件到现有无 PDF 的 Page；已有不同 PDF 时拒绝，不替换。相同 PDF 重试复用原 Page。`title` 仍必填，但不会更改目标已有标题。`parent_page_id`：创建 PDF 子页，与 `page_id` 互斥。
- 新 PDF Page 按标题、父页、文件身份去重；这不能代替 DOI/ISBN 判重。嵌入批注转换为原生 Gamma 块，原 PDF 批注保留。`inspect_pdf_pages(page_ids=[...])` 检查哈希、字节数、页数及文件是否真正在服务器。
- 大于 16 MiB 的公开 PDF 优先 `save_paper` 从真实来源 URL 导入，再验证。仅有本地/校园浏览器下载的大 PDF 且工作区尚无该文件时，当前 MCP 尚无分片上传；报告具体能力缺口，先扩展 MCP，不能改走网页上传、伪造公网地址、直写上传目录，或把截取的部分当全文。

## 归档、笔记和重试

- `create_page(title, folders=[已有目录ID])` 创建文本 Page；`create_subpage(title, parent_page_id)` 创建文本子页。需要多个既有目录时可在创建阶段明确传入。
- `save_paper(folder=路径或ID)` 会创建缺失目录，并保留原有其他分支的归档；祖先目录可能被更具体的子目录取代。相同已有 PDF 可用它补一处归档。
- 同一 Page 可归入多个目录，目录归属无主次；复用已有 Page 与 PDF，不因目录增加而复制实体。
- `move_page(page_ids=[...], folder=路径或ID)` 按当前目录上下文归档，保留当前目录之外的归属；路径相对当前目录解析，`folder=""` 归入当前目录，在库根则移出所有目录。需归入多个目录时按工具说明逐目录调用，写后复核目标及应保留的归属。子页继承最外层 Page 的目录。
- `label_page(page_ids=[...], add=[...])` 按名称增量添加标签，可自动建立缺少的标签；省略 `remove` 保留原标签。
- `create_block(parent_id=PageID, content=...)` 只添加必要的来源/用途说明。属性不能用这类笔记替代。不要传本机路径冒充上传。
- 先解析 MCP 的 `structuredContent`，缺失时读文本，不猜 Page ID。每次写入都需确认返回结果；超时先读取实际状态再重试。测试用隔离工作区，不往生产库制造测试文献。

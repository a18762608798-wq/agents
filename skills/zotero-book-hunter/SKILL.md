---
name: zotero-book-hunter
description: 找书和讲义并入库 Zotero。当用户说找书、加书、把教材/专著/讲义放进 Zotero、给出书名或 ISBN 要入库时使用，哪怕用户没说 ISBN 也要先查 ISBN 再入库。只管书和讲义：按主题找论文、补参考文献走 zotero-paper-hunter；只在库里检索不入库走语义搜索，不要用本 skill。
---

# zotero-book-hunter:找书与讲义入库

输入是一本书名/ISBN 或一份讲义 URL，输出是入库结果报告。默认每次最多处理用户点名的书，不主动扩写书单。

## 前置条件

- Zotero desktop 运行中。`zotero-mcp` 无法连接（`Connection refused` / 超时 / 工具不可用）时优先停下来向用户报告连接问题，等用户确认后再继续，不擅自硬读本地 `~/Zotero/zotero.sqlite` 绕过。只有用户明确要求应急盘点时，才可只读该文件做盘点，且入库动作必须等桌面端在线。
- 网络下载失败或超时时加载 `env-proxy` skill 走代理重试，不自己拼代理参数。

## 流程

### 0. 定目标 collection

用 `zotero_search_collections` 按主题找书类 collection（如 `quant_comp` 下的 `book`）。

- 命中多个（如 `quant_comp/book` vs `quant_mechanics/book`）时用 question 工具问用户，不猜。
- 先 `zotero_get_collection_items` 看里面已有什么，目标 key 记下来，后续全部落到它，不散落。

### 1. 判重

- 有 ISBN：直接比对（`zotero_search_items` 搜标题短查询核对）。
- 只有书名：`zotero_search_items`（作者+书名短查询）+ `zotero_semantic_search` 取并集，判重键用归一化标题（小写去标点）。
- 结论只有两种：`已有`（给 key，跳过入库）或`缺失`（进第 2/3 步）。

### 2. 正式书：ISBN 入库

- 用户只给书名时先 `websearch` 查官方 ISBN（出版社页优先，如 Cambridge），不要编 ISBN。
- `zotero_add_by_isbn(isbn, collections=[目标key], if_exists='file', tags=['textbook'])`。`if_exists` 永远用 `file`。
- 无免费 PDF 的书（如 Nielsen-Chuang）先留条目，然后从 `https://z-library.biz/` 等非官方网站获取；或用户自己有文件时按第 4 步挂附件。

### 3. 讲义/网页：URL 入库

- `zotero_add_by_url(url, collections=[目标key], if_exists='file', attach_mode='none', tags=['textbook','lecture-notes'])`。
- 标题是 URL 原样时（如 Preskill 主页），`zotero_update_item` 改成人类可读标题。

### 4. 取附件

严格按以下优先级，不跳步。用户明确指定来源时按指定来源取，不主动推荐来源：

1. 作者官网免费版（Watrous 的 TQI.pdf、Wilde 的 qit-notes.pdf 这类，遵守页面上的个人使用/CC 声明）。
2. 用户本地文件（`~/下载/` 等）：先验后挂。
3. `zotero_attach_file(url=...)` 直挂（常被服务端拒绝，被拒就走第 4 步）。
4. `curl` 下到 `/tmp/opencode/`，`file` 验明是 PDF，再 `pdftotext` 读前 3 页，标题与目标条目对不上就丢弃，不许挂错附件。对上则 `zotero_attach_file(file_path=...)`，成功后删临时文件。
5. 以上全失败，且该书确定有合法在线来源但需 JS 渲染（如出版社动态页、图书馆馆藏页、Google Books 预览）：用浏览器后端取，优先 Playwright MCP（`browser_navigate`+`browser_snapshot`）；MCP 不行才加载 `agent-browser` skill 按其规范取（独立命名会话，`agent-browser doctor` 无 fail 先行）。
6. 依然没有pdf源可以尝试用浏览器后端（优先 MCP）从 `https://z-library.biz/` 获取.
7. 遇到“相同 MD5 已存在”提示即停，不重复上传。

### 5. 修元数据

入库后必 `zotero_get_item_metadata` 核对，刚建完就 404 时等几秒重试一次（同步延迟），Open Library / Google Books 的噪音很固定，见一个修一个：

- 出版社错成 `University of Cambridge ESOL Examinations` → 改 `Cambridge University Press`。
- 作者里混入出版社地名（如 `INDIA, CAMBRIDGE`）→ `zotero_update_item(creators=[...])` 只留真作者。
- 标题大小写怪或带 `- 10. ed.` 尾巴 → 改标准书名。

### 6. 打标签

- 正式书：`textbook`。
- 讲义：`textbook` + `lecture-notes`。
- 用 `zotero_update_item(add_tags=[...])` 增量加，不碰已有标签，不自创其他标记。

### 7. 收尾

- 跑 `zotero_update_search_database`（增量），失败不阻塞报告，如实写。
- 按固定模板报告：

```text
## 入库报告:<任务一句话>
- 目标collection:<路径>(key)
- 新增:N本
  1. 书名 — 作者,年份,ISBN — key — 有PDF附件/仅条目
- 已有(跳过):N本(给key,说明命中原因:ISBN/标题)
- 失败:N本(给原因)
```

## 可调用的其他 skills

- `env-proxy`：下载/PDF 直挂失败且疑似网络问题时加载。
- 浏览器（Playwright MCP 优先，`agent-browser` 备选）：仅第 4.5 步用，即静态手段取不到合法来源时。用于突破登录墙、付费墙、验证码。
- 不要调用 `zotero-paper-hunter`（那是论文链路，判重标签体系不同，混用会污染 `agent-crawled/unreviewed`）。

## 禁止事项

- 不许在 `zotero-mcp` 失联时擅自硬读 `~/Zotero/zotero.sqlite` 绕过，必须先报告连接问题。
- 不许把标题对不上的 PDF 挂到条目下。
- 不许关掉去重（`if_exists` 永远用 `file`，不许 `duplicate`）。
- 不许一次处理超过用户点名的书，不主动扩写书单。
- 附件来源以用户指定为准，不替用户做来源决策，不评价来源合法性。
- 测试或误删进 Trash 的条目仍会显示在 collection 视图里（悬挂引用），彻底清理要用户在桌面端清空 Trash，报告里如实说明。

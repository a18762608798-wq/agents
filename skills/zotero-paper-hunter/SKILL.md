---
name: zotero-paper-hunter
description: 根据任务描述为 Zotero 文库查缺补漏找论文并自动入库。当用户说找文献、搜论文、补参考文献、查缺某个方向的论文、给研究任务配文献、把论文入库 Zotero,或给出一段研究任务描述要配齐相关文献时使用。流程是经 arXiv/OpenAlex API 优先发现候选(API 不可用时回退 websearch+浏览器，Scholar 只做补充),开放获取直接取 PDF,无开放获取先过校园订阅门禁(校园网内才试机构订阅下载,目前只支持APS),再取条目元数据走 sci-hub 拉全文,经 zotero-mcp 以去重方式入库到<主题>/paper/inbox 并打上 agent-crawled + unreviewed 标签。不用于单纯的库内检索(那用语义搜索即可),不用于非学术内容,找书/教材/讲义入库走 zotero-book-hunter。
---

# zotero-paper-hunter:任务驱动的文献查缺与自动入库

输入是一段**任务描述**(中文或英文),输出是入库结果报告。默认每次最多入库 3 篇,超出时只报告候选不断言入库,除非用户明确要求数量。

## 前置条件

- 浏览器后端二选一，优先 Playwright MCP（`browser_*` 工具已连接即用：开页、取快照，页面变化后必须重新 snapshot）。MCP 不可用或失败时才用 `agent-browser` CLI：`agent-browser doctor` 无 fail，每次任务使用独立命名会话，禁止用默认会话：

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix hunter)"
```

出发前先加载其工作流（`agent-browser skills get core`），遵守 snapshot-and-ref 规范。

- 后端命令对照（第 3、4 步遇到 agent-browser 方言时按此翻译）：开页→`browser_navigate`，`snapshot`→`browser_snapshot`，截图→`browser_take_screenshot`，`keyboard type` 真实按键输入→`browser_type`（慢速逐字），frame 上下文 JS→`browser_evaluate`（指定 frame）。

- zotero-mcp 可用(Zotero desktop 运行中)。任何 `Connection refused` 先提示用户开启 Zotero,不硬闯。
- 结果解析:zotero-mcp 工具返回的是人类可读文本,不是 JSON(如 `Collection key: \`XXXXXXXX\``,`Item key: \`XXXXXXXX\``)。不许 `JSON.parse` 整个结果,key 一律用文本匹配(如 `key: ([A-Z0-9]{8})`)提取;取不到 key 就把原文贴出来人工看,不许猜 key。

## 流程

### 1. 定主题与目标 collection

从任务描述抽主题关键词,用 `zotero_search_collections` 在库里找同主题 collection。

- 命中:目标定为该主题下的 `paper/inbox`(如 `quant_comp/paper/inbox`),缺 `inbox` 则新建。同时看该主题下有无 topical 子 collection(如 `random_measurement`),有且明显对口时同时归档 inbox 与子 collection,不只放一处。
- 未命中:新建主题链。仿现有结构 `physics/<topic>/paper/inbox`(顶层挂在研究根下),用 `zotero_create_collection` 逐级建,并在报告里声明新建了哪条链。
- 目标 collection key 记下来,后续所有入库都落到它,不散落。

### 2. 查缺:库里已有什么

对每个候选方向各做一次,取并集作为"已有集":

- `zotero_semantic_search`(主题句,limit 10)拿语义相关条目。
- `zotero_search_items`(作者/关键词短查询)拿精确条目。
- 判重键:DOI 优先,其次归一化标题(小写去标点)。只比对 DOI 与标题,不猜。
- 注意:`zotero_search_items` 用 DOI 字符串检索不可靠(曾漏报库内已有条目)。最终判重以第 5 步 `zotero_add_by_doi(doi, if_exists='file')` 的返回为准:返回"Already in library"即`已有`(取其 key),真正新入库才算`缺失`。第 2 步的结论视为初筛,入库时的返回才是终判。

判重结论只有两种:`已有`(给 key)或`缺失`。`缺失`的才进入第 3 步。

### 3. 发现候选:API 先行,websearch/浏览器只做补充

三层按顺序用,上一层可用就不再往下挖,够数即停:

- Layer 1——学术 API(首选,无 key,结构化元数据,一次请求多条,比浏览器逐页开销小一个量级):
  - arXiv:`http://export.arxiv.org/api/query?search_query=all:<关键词>&sortBy=submittedDate&sortOrder=descending&max_results=<N>`(经 `webfetch`/`curl` 取 Atom,记得跟 301 跳转如 `curl -L`;多词用 `all:"短语"`)。请求之间至少间隔 3 秒(arXiv 官方要求);遇 429/503 退避等待,不硬刷。`max_results` 按需 10~15。
  - OpenAlex:`https://api.openalex.org/works?search=<关键词>&sort=cited_by_count:desc&per-page=<N>`(要被引/热度时用);要最新改 `sort=publication_date:desc`,可加 `filter=from_publication_date:<年>-01-01` 限年份。每条自带 DOI、OA 直链、被引数,直接记下供第 4 步用。注意 `search` 是宽泛匹配,取回后必须按标题/摘要相关性人工筛一遍,不对口就收窄关键词或回 arXiv/Layer 2,不要把高被引但不相关的经典文献当候选。
  - 分工:要最新 → arXiv;要被引/热度/DOI 全 → OpenAlex。任一失败/限流切另一个;两个都不可用才降级 Layer 2。
- Layer 2——`websearch` 补广度:出版商页、综述、GitHub paper-list 等 API 覆盖不到的。对每条记录标题、作者、年份、出版物、有无 arXiv ID/DOI。
- Layer 3——浏览器核实:只抽查(arXiv 摘要页或出版商页);只有需要看 `[PDF]` 直链或引用列表时才上 Google Scholar。Scholar 在 headless 下几乎必触发"异常流量"限流:一旦触发立刻停手,不许绕过验证码硬刷。不要把 Scholar/浏览器作为第一来源。
- 记录优先顺序不变:arXiv 条目记 arXiv ID(后续走 `add_by_url` 最稳);有 DOI 的走 `add_by_doi`;有 `[PDF]` 直链的记下待第 4 步直取;只有引用信息、既无 PDF 又无 DOI 的排最后。API 返回的 DOI/标题可直接用于第 2 步判重比对。

### 4. 取全文

严格按以下顺序,不跳步:

1. 开放获取 PDF(出版商/`[PDF]`/arXiv):`curl` 直下到 `/tmp`,验 `file` 为 PDF。
2. 校园订阅(仅第 1 条无 OA 全文时):本 skill 目录 `licensed-access/`(用法与退出码见其中 README)。
   - 会话级门禁整个会话只跑一次并记住结论:`bash licensed-access/gate.sh`;非 0 则本会话所有论文跳过本条。
   - 有 DOI 才试,无 DOI(只有 arXiv ID/标题)直接跳过;目前只支持 APS(`10.1103` 前缀),其他前缀一律跳过(路由表见 README)。
   - 调用:`node licensed-access/aps_download.mjs <DOI> /tmp/<doi末段>.pdf`。成功则带着本地 PDF 继续第 3 步建条目,再按第 5 步"PDF与条目分离"路径 attach。
   - 纪律:串行,每次调用间隔 ≥15 秒;exit 3/4 → 本会话剩余论文全部跳过本条;exit 2/5 → 仅本篇跳过。失败当无事发生,继续第 3 步。
3. 无 OA 无订阅:先拿元数据——有 DOI 用 `zotero_add_by_doi`(天然带 CrossRef 元数据),只有 arXiv ID 用 `zotero_add_by_url(https://arxiv.org/abs/<id>)`。
4. 按顺序走 sci-hub 镜像,先 `https://sci-hub.jp/`(中文"你是机器人吗"点"不是"即过,目前无验证码),再 `https://sci-hub.box/`:搜 DOI → 过"机器人确认" → DDoS-Guard 弹窗用 frame 上下文 JS 触发 checkbox → 图片验证码截图裁剪放大后人工识读(把候选字符报出来,是一次性的,每次刷新) → 文本框用真实按键(`keyboard type`,不用 `fill`)输入 → Verify → 文章页 `snapshot -u` 取 storage 直链下载。注意 Verify 按钮可能专防自动化点不动,此时收手让人手动过,不要硬绕。
5. 下载后必验:读 PDF 第一页文本,标题与目标条目对不上就丢弃,不许挂错附件。

### 5. 入库(全部去重,带退路链)

按以下退路链逐级尝试,上一步失败或超时且核实未写入才走下一步,不许跳级:

1. 有 DOI:`zotero_add_by_doi(doi, collections=[...], if_exists='file')`。
2. 上步失败:有 URL(arXiv abs/出版商页)则 `zotero_add_by_url` 同参数。
3. 再失败:手写 BibTeX 经 `zotero_add_by_bibtex` 直写元数据(字段必须与原文逐项核对)。

- 只有本地 PDF:`zotero_add_from_file` 同参数。
- PDF 与条目分离时(先建条目后下到 PDF):`zotero_attach_file`。遇到"相同 MD5 已存在"提示即停,不重复上传。
- 单次入库动作超时但不确定成败时:用标题/DOI 检索核实后再决定,不盲目重加。

### 6. 打标签

每个新入库(或新挂附件)的条目加:

```text
agent-crawled, unreviewed
```

用 `zotero_update_item(add_tags=[...])` 增量加,不碰已有标签。含义:机器自动拉取、未经人工审核。用户审核后自行去掉 `unreviewed`。全库统一只用这一套标记,不得自创其他标记(如 `auto-pull`),发现异名标记要么不用、要么报告用户定夺,不擅自推广。

### 7. 报告(固定模板)

```text
## 入库报告:<任务一句话>
- 目标collection:<路径>(key)
- 新增:N篇
  1. 标题 — 作者,年份,DOI — key — 有全文PDF(注明OA/订阅/sci-hub)/仅条目
- 已有(跳过):N篇(给key,说明命中原因:DOI/标题)
- 失败:N篇(给原因:无资源/验证码过不去/标题对不上)
```

## 禁止事项

- 不许把标题对不上的 PDF 挂到条目下。
- 不许关掉去重(`if_exists` 永远用 `file`,不许 `duplicate`)。
- 不许把非学术内容(博客、营销页)当论文入库。

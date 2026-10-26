---
name: book-mainline-grasper
description: 快速抓住一本书指定范围（章/节/页码）的主线，同时落笔记仓库 Markdown 并在 Zotero 打标记。仅当用户明确说使用 book-mainline-grasper、本 skill、抓主线+记笔记+打标三件套时才触发，不要自行触发。触发后先检查笔记仓库目录和 zotero-mcp 连接，任一异常先向用户反馈再动手。
---

# Book Mainline Grasper

只做一件事：给定 Zotero 已有藏书 + 指定范围，抓住主线，写笔记，打标记。不找新书，不入库，库内检索只用语义搜索。

## 0. 触发与前检（必须先做）

1. 仅显式触发。用户必须明确说用本 skill（例如“用 book-mainline-grasper 抓 Kittel 第一章”）。没有显式说法一律不用。
2. 检查笔记仓库：`read` 确认目标目录存在、可写。不存在则停下问用户是否创建，不要自作主张套用 `solid_physics` 之外的路径。
3. 检查 zotero-mcp：并行调 `zotero_list_libraries`、`zotero_get_search_database_status`、`zotero_write_capabilities`。任一失败或无写权限，停下向用户反馈，不继续。
4. 向用户确认四要素再开工：书名（Zotero itemKey）、范围（章/节/页）、笔记路径（如 `solid_physics/chapter1.md`）、标记套装（教材套/论文套，默认教材套）。

## 1. 定位书与范围

1. 用 `zotero_semantic_search`（主）+ `zotero_search_items`（辅）+ `zotero_search_collections` 定位书，拿到 itemKey、attachmentKey、所在 collection 路径。
2. 用 `zotero_get_item_metadata` 拿 publisher、ISBN、citationKey（BetterBibTeX）；用 `zotero_get_pdf_outline` 拿章起止页。
3. 用 `zotero_read_pdf_pages` 按 outline 页码读正文，`format=text` 先行；遇到公式表格乱码则对该页用 `format=image` 重读，必要时用 `zotero_get_page_layout` 取 rect 放大。

## 2. 抓主线（不硬压条数）

1. 按书的目录顺序抓主线，不追求最少条数，但每条必须可回指到 PDF 页。
2. 术语先核对再写：用 websearch 对照黄昆/USTC 标准译法。硬线：点阵（lattice，称晶格/布拉维格子，不用“格子”）、原胞（primitive cell，称初基原胞，不用“初基胞”）、惯用晶胞（conventional cell，不用“惯用胞”）、WS 原胞（维格纳-赛兹原胞）、密堆积（close packing）、米勒指数（Miller indices）、格点/阵点（lattice point）。
3. 对话内数学用浏览器界面原生 LaTeX：行内 `\(...\)`，独立块 `$$` 单独成行三段式，不用 `$`。

## 3. Zotero 打标（与根目录规范对齐）

根规范是 Zotero 独立笔记 `PDF标记规范-教材论文两套`（如 `3QRJF6GA`），每次开工前用 `zotero_get_notes` 读一遍原文，不要凭记忆：

- 通则：颜色=语义，形状=重要度；高亮=结论记住，下划线=支撑定位；一段只标一次；前缀 `[定][性][例][Q][TODO][!]`，tags 同步。
- 教材套：蓝 `#2ea8e5` 定义定理、绿 `#5fb236` 性质推论判据、黄 `#ffd400` 例题样板、灰 `#aaaaaa` 背景只下划线、红 `#ff6666` 没懂必带 `[Q]`、紫 `#a28ae5` 跨章钩子。
- 论文套：黄问题主题句、橙 `#ff8c19` 创新 `[!novel]`、紫细节参数、蓝定义假设、绿证据结论、红质疑局限。
- 流程：读前选套不混用；`zotero_create_annotation` 逐条打（attachmentKey + PDF 页码 + 原文精确 `text`）；打完用 `zotero_get_annotations` 回查；红必须清零或转笔记。

## 4. 写笔记（文件内 $ 规范 + zotcite 头 + 一词一条）

1. 结构：一词一条，跨概念单列关系。
   - `##` 只做主题（对应书小节）。
   - `###` 必须是一个概念，标题即首次定义（含英文），下只跟该概念的定义/性质/例，不把多个概念塞进同一定义或同一性质。
   - 定义：1 行，只讲该概念是什么。
   - 性质：逐条列，每条只讲该概念的判据、公式、推论。
   - 例：1-2 个实例、计算样板、反例。
   - 凡牵涉两个概念（如原胞 vs 晶胞、晶向 vs 晶面、hcp vs fcc），不塞进任一概念的性质，统一放同主题末尾 `关系` 行，写明 A vs B。
   - 一条笔记对应 Zotero 一段一标，可回指。
2. 晶向晶面必须配对写：晶向 `[uvw]` 求法为方向矢量分量比最小整数；晶面 `(hkl)` 求法为截距倒数比最小整数；关系注明一般不垂直、仅立方 `[hkl]⊥(hkl)`。
3. 文件内数学用 Markdown `$` 规范：行内 `$...$`，块 `$$` 单独成行。不要把对话的 `\(...\)` 写进文件。
3. Zotero 信息只在开头出现一次，后面不再提。开头写法遵 `~/.config/nvim/doc/04_plugin/zotcite/02_usage/01_basic.md`：
   - YAML 头含 `bibliography: references.bib` + `collection: [<Zotero collection 名>]`。
   - 首行正文用 `@<BetterBibTeX citekey>` 引用本书（如 `@kittel2020introduction`），正文内不再写 itemKey、annotationKey、色号。
4. 小步编辑，写完 `read` 回查 diff，确认无 Zotero key 泄漏、无 `\(...\)` 残留、无非标译名。

## 5. 轻量自检（vibe 模式）

- 手动跑两例：一例教材章（如 Kittel Ch1→`chapter1.md`），一例论文节；检查一词一条、关系单列、文件 `$` 规范、Zotero 色号前缀正确、一段一标。
- 用户说停就停，不跑 full benchmark，不做 description 优化循环。

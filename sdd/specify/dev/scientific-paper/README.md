# scientific-paper

依赖 Exp 上游产物的独立论文技能包。源继续保留在
`~/.agents/sdd/specify/dev/scientific-paper/`，按任务直接使用各技能，
不再作为 Spec Kit preset 安装，也不创建 Paper spec、plan、tasks 或 paper feature。

## 上游输入与理论成文

- `docs/planning/paper-outline.md`：唯一论文大纲，说明主线、章节与 Dxx 数据需求。
- `docs/planning/experiment-map.md`：Exp 的生产归属与依赖，不另建 paper-map。
- `specs/expXX/`、`specs/shared-XX/` 及真实数据、图：确认实际实验定义和结果。
- `docs/experiment-notes/`：实验实现所需的模型、公式与计算约定，允许简写，不是正式论文稿。

正式理论从拟写问题出发，先找参考文献并阅读相关全文、核验适用条件，
再独立组织定义、前提与推导，核对 Exp 的符号、参数、归一化和边界条件。
可以保留正确公式；区分文献结论与项目自己的构造，不以相近文献为项目公式强行背书。
共同的证据、引用和缺件规则见
[writing-policy](skills/paper-writing-section/references/writing-policy.md)。

## 技能

| 技能 | 用途 |
| --- | --- |
| `paper-writing-section` | 直接撰写或修改章节与理论论证 |
| `paper-zotero-hunter` | 从计划论述发现文献，全文核验后绑定引用 |
| `paper-figure-layout` | LaTeX 图表位置与组合布局 |
| `paper-latex-formatting` | 模板、格式、字体与编译前检查 |
| `paper-self-review` | 根据现有大纲、目标 venue 和真实证据评审稿件 |
| `paper-revision` | 按作者或审稿意见修改并复核 |
| `paper-assembly` | 可选的整篇协调与缺件检查入口 |

各技能可以单独调用，无固定阶段流水线。
普通改稿直接改正文；主线、核心主张或数据需求变化时更新已有大纲。
Dxx / Sxx 编号不随章节顺序变化。
缺文献或理论依据时补核验；缺实验数据或需要改变实验含义时返回 Exp，
不在 Paper 技能内自动开展实验或制造结果。

## 安装与同步

从项目根目录安装到 `.agents/skills/`：

```bash
paper_source="$HOME/.agents/sdd/specify/dev/scientific-paper"
mkdir -p .agents/skills
for paper_skill_dir in "$paper_source"/skills/paper-*; do
    cp -a "$paper_skill_dir" .agents/skills/
done
bash "$paper_source/scripts/install-fonts.sh" .
```

已有同名技能先比较差异，保留项目定制后再合并；不直接覆盖已有稿件。
技能包版本记录在 `skills/VERSION`。更新领域技能不切换 Exp preset 优先级，
也不通过 `specify integration upgrade` 生成 Paper 命令。

文献相关任务需要可用的 Zotero MCP 与 `zotero-paper-hunter` /
`zotero-book-hunter`；库内检索直接使用 Zotero 搜索。
这些依赖只在对应任务需要时使用，排版等独立任务不要求先完成文献流水线。

## 工程与字体

以项目 `docs/README.md` 为路径约定入口；稿件位于 `docs/paper/`，
规划位于 `docs/planning/`，派生看板位于 `docs/status/`。
论文看板只反映图与数据的就绪度，不证明正文、引用或正式论证完成。

保留 `skills/`、`assets/fonts/`、`scripts/install-fonts.sh` 与 README。
中文模板位于 `skills/paper-latex-formatting/templates/pra/`，
字体依赖是 `assets/fonts/noto-serif-cjk/` 中的 Regular / Bold OTF 与上游 LICENSE。
安装脚本预先检查全部文件，已有文件内容冲突时停止，不静默覆盖。

中文模板从 `docs/paper/` 编译，通过
`../../assets/fonts/noto-serif-cjk/` 按文件加载，不依赖系统字体名。
Times New Roman 的四种 TTF 由上游 scientific-computing 提供，
保留其原授权说明，不与 Noto 的 SIL OFL 混用。
已有嵌入字体的 PDF 不要求为了编译论文另外安装绘图字体。

## 可选 PDF 审阅环境

使用 PDF 审阅脚本时，按项目的 `scientific-project-environment` 管理解释器。
项目采用 CondaPkg 时，在 `CondaPkg.toml` 的 `[deps]` 中加入
`pymupdf = ""`，再运行：

```bash
julia --project=. --startup-file=no \
  -e 'using CondaPkg; CondaPkg.resolve()'
```

使用 `.CondaPkg/.pixi/envs/default/bin/python` 执行审阅脚本。
结构解析未识别章节时，改用文本提取并对照 LaTeX，不把解析失败当作缺章证据。

## 旧安装迁移

旧的 `preset.yml`、`commands/`、Paper spec/plan/tasks/constitution 模板、
`paper-map` 技能和 assembly 固定阶段检查已退役。
已有项目保留大纲、稿件、引用、数据和图，按上述方式同步独立技能；
若仍安装了旧 Paper preset，需通过 Spec Kit 的 preset 管理流程退役旧注册，
保留 scientific-computing 的 Exp 命令，不再切换到 Paper preset。

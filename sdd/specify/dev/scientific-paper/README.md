# scientific-paper preset

面向“数值结果 → 正式 LaTeX 论文”的 Spec Kit 模板包。核心主张：**论文的每个主张都绑定上游数据产物，缺件留空不编数，解释性正文问用户要推测并标记待验证**。

依赖上游 `scientific-computing` 产物：`specs/expXX`（实验定义）、`S##`（共享输出）、`D##`（数据集 + `figs/` 图）、`docs/planning/paper-outline.md`（论文大纲）。

## 固定项目布局

以项目 `docs/README.md` 为目录约定入口；规划统一放在 `docs/planning/`
（`paper-outline.md`、`experiment-map.md`，以及启用后的 `paper-map.md`）。
LaTeX 工程保留在 `docs/paper/`，上游规格与图片保留在 `specs/`、`figs/`。
派生看板为 `docs/status/paper.html` 与 `docs/status/experiments.html`，
不在项目根目录另建副本。

中文字体和上游许可证统一保存于 `assets/fonts/noto-serif-cjk/`
（`NotoSerifCJKsc-Regular.otf`、`NotoSerifCJKsc-Bold.otf`、`LICENSE`）。
中文模板假定从 `docs/paper/` 编译，通过相对路径按文件加载，不依赖系统字体名。
项目若提供 Times New Roman，四种字形放在 `assets/fonts/times-new-roman/`，
由绘图 helper 按文件注册，无需系统安装；保留原授权说明，不混用 Noto 的
SIL OFL。`scientific-paper/assets/fonts/noto-serif-cjk/` 保存中文模板依赖的
两种 OTF 与 LICENSE；Times New Roman 的四种 TTF 保存在上游
`scientific-computing/assets/fonts/times-new-roman/`。各自通过随包的
`scripts/install-fonts.sh` 安装到项目同名目录，不要求系统安装。
只插入已有嵌入字体的 PDF 不要求另外加载绘图字体。

## 文件

- `preset.yml` — manifest，声明 id / provides / replaces
- `assets/fonts/noto-serif-cjk/` — 中文模板依赖的两种原始 OTF 与 LICENSE
- `scripts/install-fonts.sh` — 安装中文字体依赖到项目 `assets/fonts/`，支持幂等执行且不覆盖内容不同的文件
 - `templates/constitution-template.md` — 论文宪法：spec 权威、证据绑定、数字不编、缺件协议（GAP-DATA 留空 / GAP-INTERP 问用户要推测）、8 个 paper-* skills 分工
- `templates/spec-template.md` — 论文定义：主张 / 上游输入 / 章节 / 图位 / 引用需求 / 缺件；合同：SEC / FIG / CLM / GAP / CIT
- `templates/plan-template.md` — 章节→skill 映射、LaTeX 工程结构、编译与评审计划
- `templates/tasks-template.md` — 任务：按 Assemble → Write → Cite → Format → post-implement review 推进
- `commands/speckit.specify.md` — 从论文主线创建或更新 paper specification
- `commands/speckit.clarify.md` — 澄清主张口径，向用户要依赖结果的解释推测
- `commands/speckit.plan.md` — 根据 spec 生成写作计划
- `commands/speckit.tasks.md` — 根据 spec 和 plan 生成可执行任务列表
- `commands/speckit.analyze.md` — 只读检查 spec / plan / tasks 的完整性、一致性与 constitution 符合度
- `commands/speckit.implement.md` — 按 tasks 执行写作与编译；随后由 `paper-self-review` / `paper-revision` skill 完成 post-implement review loop，最后由 converge 审计
- `commands/speckit.converge.md` — 审计成文是否满足 spec，推测转正或降级，剩余工作补回 tasks

注意：本 preset 没有 `/speckit.review` 命令。`paper-self-review` 和
`paper-revision` 是 Implement 完成后的 skill 调用；`/speckit.converge`
只负责最终审计与收敛。

## 局部 Skills 安装

本 preset 的 `paper-*` skills 随模板仓库维护，不再安装到全局 skills。创建论文项目后，
在项目根目录执行一次：

```bash
mkdir -p .pi/skills
cp -a /path/to/scientific-paper/skills/. .pi/skills/
bash /path/to/scientific-paper/scripts/install-fonts.sh .
```

Pi 自动发现项目 `.pi/skills/`；同名技能冲突时检查启动诊断。模板升级后需要人工重新同步；已经被项目
定制过的 skill 不要直接覆盖，应先比较 diff。`skills/VERSION` 记录当前 skill 版本。

## 可选审阅环境

如果执行 `paper-self-review` 的 PDF 审阅，项目需要通过 CondaPkg 提供 PyMuPDF。
在项目根目录的 `CondaPkg.toml` 中加入：

```toml
[deps]
pymupdf = ""
```

然后解析项目环境：

```bash
julia --project=. --startup-file=no \
  -e 'using CondaPkg; CondaPkg.resolve()'
```

使用 `.CondaPkg/.pixi/envs/default/bin/python` 运行审阅脚本，不创建 `venv`，
也不使用系统 `pip`。如果 PDF 结构解析无法识别 section，使用纯文本提取回退，
并在审阅报告中记录该回退。

## 标识约定

`SEC-###` 章节、`FIG-###` 图位、`CLM-###` 主张（绑定 `D##`）、`GAP-###` 缺件（`-DATA` 缺数缺图 / `-INTERP` 待解释）、`CIT-###` 引用需求、`T###` 任务。跨文档用这些 ID 互引，避免同一事实写两份。

## 安装到项目

```bash
specify init --here --integration pi --script sh # 初始化
specify preset add --dev ~/.agents/sdd/specify/dev/scientific-paper --priority 4
bash .specify/presets/scientific-paper/scripts/install-fonts.sh .
specify preset resolve spec-template
```

具体的dev会被复制到 `.specify/presets/`

改完源目录后重装：

```bash
specify preset update scientific-paper --dev ~/.agents/sdd/specify/dev/scientific-paper --priority 4
bash .specify/presets/scientific-paper/scripts/install-fonts.sh .
specify integration upgrade pi --script sh
```

修改本 preset 源目录后，先用 `specify preset update` 更新项目中的 preset，
再用 `specify integration upgrade` 更新 Pi 的 `.pi/prompts/` 集成文件。
不要手工把 preset command 复制到 `.pi/prompts/`；priority 越小越优先，
当前项目通常使用 `scientific-computing` priority 3 管理实验 feature，使用
`scientific-paper` priority 4 管理论文 feature。需要切换到论文命令时，暂时将
`scientific-paper` 调整为更高优先级（更小的数字）。
